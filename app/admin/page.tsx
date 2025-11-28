"use client";
import React, { useState, useEffect } from 'react';
import SurgeryRoomDisplay from '../components/SurgeryRoomDisplay';
import { database } from '../../lib/firebase';
import { ref, onValue, off } from 'firebase/database';

// Helper to format date as YYYY-MM-DD
const toYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AdminPage = () => {
  const [rooms, setRooms] = useState([]);
  const [history, setHistory] = useState([]);
  const [displayDate, setDisplayDate] = useState(new Date());

  const isToday = toYYYYMMDD(new Date()) === toYYYYMMDD(displayDate);

  // Helper to deduplicate surgeries
  const deduplicateSurgeries = (roomsData) => {
    const seen = new Set();
    return Object.values(roomsData).filter(Boolean).map((room: any) => {
      if (room.surgeries) {
        room.surgeries = room.surgeries.filter(surgery => {
          if (!surgery.nationalId) return true; // Keep if no ID
          const key = `${surgery.nationalId}-${toYYYYMMDD(new Date(surgery.dateTime))}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      return room;
    });
  };

  useEffect(() => {
    const fetchArchivedData = (date) => {
      fetch(`/api/archive?date=${toYYYYMMDD(date)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.rooms && Object.keys(data.rooms).length > 0) {
            // Deduplicate archived data too
            const uniqueRooms = deduplicateSurgeries(data.rooms);
            setRooms(uniqueRooms);
            const allSurgeries = uniqueRooms.flatMap((room: any) => room.surgeries || []);
            setHistory(allSurgeries);
          } else {
            const defaultRooms = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, surgeries: [] }));
            setRooms(defaultRooms);
            setHistory([]);
          }
        })
        .catch(error => {
          console.error('Failed to fetch archived data', error);
          setRooms([]);
          setHistory([]);
        });
    };

    if (isToday) {
      const roomsRef = ref(database, 'rooms');
      const listener = onValue(roomsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const todayString = toYYYYMMDD(new Date());
          // First deduplicate
          let processedRooms = deduplicateSurgeries(data);

          // Then filter for today
          processedRooms = processedRooms.map((room: any) => {
            if (room.surgeries) {
              room.surgeries = room.surgeries.filter(surgery => toYYYYMMDD(new Date(surgery.dateTime)) === todayString);
            }
            return room;
          });
          setRooms(processedRooms);
          const allSurgeries = processedRooms.flatMap((room: any) => room.surgeries || []);
          setHistory(allSurgeries);
        }
      });
      return () => off(roomsRef, 'value', listener);
    } else {
      fetchArchivedData(displayDate);
    }
  }, [displayDate, isToday]);

  const handlePrevDay = () => {
    setDisplayDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setDisplayDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const handleAddSurgery = async (roomId, surgeryData) => {
    try {
      const res = await fetch('/api/surgeries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, surgeryData }),
      });

      if (res.status === 409) {
        const errorData = await res.json();
        alert(errorData.error || 'Duplicate surgery detected.');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to add surgery');
      }
    } catch (error) {
      console.error('Failed to add surgery', error);
      alert('Failed to add surgery. Please try again.');
    }
  };

  const handleStatusChange = async (roomId, surgeryId, newStatus) => {
    try {
      await fetch(`/api/surgeries/${surgeryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, newStatus }),
      });
    } catch (error) {
      console.error('Failed to update surgery', error);
    }
  };

  const handleRemoveSurgery = async (roomId, surgeryId) => {
    try {
      await fetch(`/api/surgeries/${surgeryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
    } catch (error) {
      console.error('Failed to delete surgery', error);
    }
  };

  const handleMoveSurgery = async (surgeryId, sourceRoomId, destinationRoomId) => {
    try {
      await fetch('/api/surgeries/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surgeryId, sourceRoomId, destinationRoomId }),
      });
    } catch (error) {
      console.error('Failed to move surgery', error);
    }
  };

  return (
    <SurgeryRoomDisplay 
      rooms={rooms}
      history={history}
      handleAddSurgery={handleAddSurgery}
      handleStatusChange={handleStatusChange}
      handleRemoveSurgery={handleRemoveSurgery}
      handleMoveSurgery={handleMoveSurgery}
      isAdmin={true}
      displayDate={displayDate}
      handlePrevDay={handlePrevDay}
      handleNextDay={handleNextDay}
      isToday={isToday}
    />
  );
};

export default AdminPage;