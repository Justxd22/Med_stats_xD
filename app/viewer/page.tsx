
"use client";
import React, { useState, useEffect } from 'react';
import { database } from '../../lib/firebase';
import { ref, onValue } from 'firebase/database';
import SurgeryRoomDisplay from '../components/SurgeryRoomDisplay';

const ViewerPage = () => {
  const [rooms, setRooms] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('rooms data:', data);
      if (data) {
        setRooms(Object.values(data));
      }
    });

    const historyRef = ref(database, 'history');
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      console.log('history data:', data);
      if (data) {
        setHistory(Object.values(data));
      }
    });
  }, []);


  const fetchData = async () => {
    try {
      const res = await fetch('/api/surgeries');
      const data = await res.json();
      if (data) {
        setRooms(Object.values(data));
      }

      // In a real app, you would fetch history from a separate endpoint
      // For now, we will just use the rooms data to build the history
      const allSurgeries = Object.values(data).filter(room => room).flatMap((room: any) => room.surgeries || []);
      setHistory(allSurgeries);

    } catch (error) {
      console.error('Failed to fetch data', error);
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
      fetchData(); // Refetch data after updating
    } catch (error) {
      console.error('Failed to update surgery', error);
    }
  };

  return (
    <SurgeryRoomDisplay 
      rooms={rooms}
      history={history}
      handleStatusChange={handleStatusChange}
      isAdmin={false}
    />
  );
};

export default ViewerPage;
