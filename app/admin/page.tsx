"use client";
import React, { useState, useEffect } from 'react';
import SurgeryRoomDisplay from '../components/SurgeryRoomDisplay';
import { database } from '../../lib/firebase';
import { ref, onValue, off } from 'firebase/database';

// Helper to format date as YYYY-MM-DD
const toYYYYMMDD = (date) => {
  return date.toISOString().split('T')[0];
};

const AdminPage = () => {
  const [rooms, setRooms] = useState([]);
  const [history, setHistory] = useState([]);
  const [displayDate, setDisplayDate] = useState(new Date());

  const isToday = toYYYYMMDD(new Date()) === toYYYYMMDD(displayDate);

  useEffect(() => {
    let activityTimer;
    const roomsRef = ref(database, 'rooms');

    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      if (!isToday) {
        activityTimer = setTimeout(() => {
          setDisplayDate(new Date());
        }, 5000); // 5-second timeout
      }
    };

    const fetchArchivedData = (date) => {
      fetch(`/api/archive?date=${toYYYYMMDD(date)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.rooms && Object.keys(data.rooms).length > 0) {
            setRooms(Object.values(data.rooms));
            const allSurgeries = Object.values(data.rooms).filter(room => room).flatMap((room: any) => room.surgeries || []);
            setHistory(allSurgeries);
          } else {
            const defaultRooms = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, surgeries: [] }));
            setRooms(defaultRooms);
            setHistory([]);
          }
          resetActivityTimer();
        })
        .catch(error => {
          console.error('Failed to fetch archived data', error);
          setRooms([]);
          setHistory([]);
          resetActivityTimer();
        });
    };

    if (isToday) {
      // Subscribe to live data
      const listener = onValue(roomsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const todayString = toYYYYMMDD(new Date());
          const filteredRooms = Object.values(data).filter(Boolean).map((room: any) => {
            if (room.surgeries) {
              room.surgeries = room.surgeries.filter(surgery => toYYYYMMDD(new Date(surgery.dateTime)) === todayString);
            }
            return room;
          });
          setRooms(filteredRooms);
          const allSurgeries = filteredRooms.flatMap((room: any) => room.surgeries || []);
          setHistory(allSurgeries);
        }
      });
      // Cleanup listener on component unmount or when date changes
      return () => off(roomsRef, 'value', listener);
    } else {
      // Fetch historical data
      fetchArchivedData(displayDate);
    }

    // Add event listeners to reset the timer on user activity
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);

    return () => {
      clearTimeout(activityTimer);
      window.removeEventListener('mousemove', resetActivityTimer);
      window.removeEventListener('keydown', resetActivityTimer);
    };
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
      await fetch('/api/surgeries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, surgeryData }),
      });
    } catch (error) {
      console.error('Failed to add surgery', error);
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