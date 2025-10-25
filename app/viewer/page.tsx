
"use client";
import React, { useState, useEffect } from 'react';
import SurgeryRoomDisplay from '../components/SurgeryRoomDisplay';
import { database } from '../../lib/firebase';
import { ref, onValue, off } from 'firebase/database';

// Helper to format date as YYYY-MM-DD
const toYYYYMMDD = (date) => {
  return date.toISOString().split('T')[0];
};

const ViewerPage = () => {
  const [rooms, setRooms] = useState([]);
  const [history, setHistory] = useState([]);
  const [displayDate, setDisplayDate] = useState(new Date());

  const isToday = toYYYYMMDD(new Date()) === toYYYYMMDD(displayDate);

  useEffect(() => {
    let activityTimer;
    let debounceTimer;
    const roomsRef = ref(database, 'rooms');

    const scheduleRedirect = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isToday) {
          activityTimer = setTimeout(() => {
            setDisplayDate(new Date());
          }, 5000); // 5-second redirect
        }
      }, 2000); // 2-second settle time
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
          scheduleRedirect(); // Schedule the redirect after data is loaded
        })
        .catch(error => {
          console.error('Failed to fetch archived data', error);
          setRooms([]);
          setHistory([]);
          scheduleRedirect();
        });
    };

    if (isToday) {
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
      fetchArchivedData(displayDate);
    }

    // Cleanup timers
    return () => {
      clearTimeout(activityTimer);
      clearTimeout(debounceTimer);
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
      isAdmin={false}
      displayDate={displayDate}
      handleMoveSurgery={handleMoveSurgery}
      handlePrevDay={handlePrevDay}
      handleNextDay={handleNextDay}
      isToday={isToday}
    />
  );
};

export default ViewerPage;
