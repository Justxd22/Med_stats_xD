
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

  return (
    <SurgeryRoomDisplay 
      rooms={rooms}
      history={history}
      isAdmin={false}
    />
  );
};

export default ViewerPage;
