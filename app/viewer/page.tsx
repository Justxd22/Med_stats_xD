
"use client";
import React, { useState, useEffect } from 'react';
import SurgeryRoomDisplay from '../components/SurgeryRoomDisplay';

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
    let interval;

    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      if (!isToday) {
        activityTimer = setTimeout(() => {
          setDisplayDate(new Date());
        }, 5000); // 5-second timeout
      }
    };

    const fetchLiveData = () => {
      fetch('/api/surgeries')
        .then(res => res.json())
        .then(data => {
          if (data) {
            const todayString = toYYYYMMDD(new Date());
            const filteredRooms = Object.values(data).filter(Boolean).map((room: any) => {
                if (room.surgeries) {
                    room.surgeries = room.surgeries.filter(surgery => toYYYYMMDD(new Date(surgery.dateTime)) === todayString);
                }
                return room;
            });
            setRooms(filteredRooms);
            const allSurgeries = filteredRooms.filter(room => room).flatMap((room: any) => room.surgeries || []);
            setHistory(allSurgeries);
          }
        })
        .catch(error => console.error('Failed to fetch live data', error));
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
      fetchLiveData();
      interval = setInterval(fetchLiveData, 5000);
    } else {
      fetchArchivedData(displayDate);
    }

    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);

    return () => {
      if (interval) clearInterval(interval);
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

  return (
    <SurgeryRoomDisplay 
      rooms={rooms}
      history={history}
      isAdmin={false}
      displayDate={displayDate}
      handlePrevDay={handlePrevDay}
      handleNextDay={handleNextDay}
      isToday={isToday}
    />
  );
};

export default ViewerPage;
