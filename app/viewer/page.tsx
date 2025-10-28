
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


  const resetToToday = useCallback(() => {
    setDisplayDate(new Date());
  }, []);

  const resetInactivityTimer = useCallback(() => {
    console.log('movvvv', inactivityTimerRef.current)
    clearTimeout(inactivityTimerRef.current);
    if (!isToday) {
      inactivityTimerRef.current = setTimeout(resetToToday, 5000); // 5 seconds
    }
  }, [isToday, resetToToday]);

  useEffect(() => {
    let inactivityTimer;
    let debounceTimer;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (!isToday) {
        inactivityTimer = setTimeout(resetToToday, 5000); // 5 seconds
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
