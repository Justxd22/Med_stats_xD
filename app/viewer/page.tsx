
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const ViewerPage = () => {
  const [rooms, setRooms] = useState([]);
  const [history, setHistory] = useState([]);
  const [displayDate, setDisplayDate] = useState(new Date());
  const inactivityTimerRef = useRef(null);

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

  const resetToToday = useCallback(() => {
    setDisplayDate(new Date());
  }, []);


  useEffect(() => {
    let inactivityTimer;
    let debounceTimer;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (!isToday) {
        inactivityTimer = setTimeout(resetToToday, 30000); // 5 seconds
      }
    };

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
          resetInactivityTimer();
        })
        .catch(error => {
          console.error('Failed to fetch archived data', error);
          setRooms([]);
          setHistory([]);
          resetInactivityTimer();
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
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchArchivedData(displayDate);
      }, 1000); // 1-second debounce

      window.addEventListener('mousemove', resetInactivityTimer);
      window.addEventListener('keydown', resetInactivityTimer);
    }

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(debounceTimer);
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
    };
  }, [displayDate, isToday, resetToToday]);


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

  const handleMoveSurgery = async (surgeryId, sourceRoomId, destinationRoomId) => {
    // 1. Optimistic Update
    const previousRooms = [...rooms];
    
    const updatedRooms = rooms.map((room: any) => {
      // Create a shallow copy of the room and its surgeries array
      const newRoom = { ...room, surgeries: [...(room.surgeries || [])] };
      
      // If this is the source room, remove the surgery
      if (String(room.id) === String(sourceRoomId)) {
        newRoom.surgeries = newRoom.surgeries.filter((s: any) => String(s.id) !== String(surgeryId));
      }
      
      // If this is the destination room, add the surgery
      if (String(room.id) === String(destinationRoomId)) {
        // Find the surgery object from the previous state
        const sourceRoom = rooms.find((r: any) => String(r.id) === String(sourceRoomId));
        const surgery = sourceRoom?.surgeries?.find((s: any) => String(s.id) === String(surgeryId));
        
        if (surgery) {
          newRoom.surgeries.push({ ...surgery, roomId: destinationRoomId });
        }
      }
      
      return newRoom;
    });

    setRooms(updatedRooms);

    try {
      const res = await fetch('/api/surgeries/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surgeryId, sourceRoomId, destinationRoomId }),
      });

      if (!res.ok) {
        throw new Error('Failed to move surgery');
      }
    } catch (error) {
      console.error('Failed to move surgery', error);
      // Rollback on failure
      setRooms(previousRooms);
      alert("Failed to move surgery. Reverting changes.");
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

  return (
    <SurgeryRoomDisplay 
      rooms={rooms}
      history={history}
      isAdmin={false}
      displayDate={displayDate}
      handleMoveSurgery={handleMoveSurgery}
      handleStatusChange={handleStatusChange}
      handlePrevDay={handlePrevDay}
      handleNextDay={handleNextDay}
      isToday={isToday}
    />
  );
};

export default ViewerPage;
