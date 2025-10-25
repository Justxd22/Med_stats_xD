"use client";
import React, { useState, useEffect } from 'react';
import SurgeryRoomDisplay from '../components/SurgeryRoomDisplay';

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
    let interval;

    // Set a timer to redirect back to today if there's no activity
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
            // For future/empty dates, create a default set of empty rooms
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
      interval = setInterval(fetchLiveData, 5000); // Poll every 5 seconds for live data
    } else {
      fetchArchivedData(displayDate);
    }

    // Add event listeners to reset the timer on user activity
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

  const handleAddSurgery = async (roomId, surgeryData) => {
    try {
      await fetch('/api/surgeries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, surgeryData }),
      });
      // Refetch will be triggered by the polling interval if it's today
    } catch (error) {
      console.error('Failed to add surgery', error);
    }
  };

  const handleStatusChange = async (roomId, surgeryId, newStatus) => {
    try {
      await fetch(`/api/surgeries/${surgeryId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, newStatus }),
        }
      );
    } catch (error) {
      console.error('Failed to update surgery', error);
    }
  };

  const handleRemoveSurgery = async (roomId, surgeryId) => {
    try {
      await fetch(`/api/surgeries/${surgeryId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId }),
        }
      );
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