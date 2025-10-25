"use client";
import React, { useState, useEffect } from 'react';
import SurgeryRoomDisplay from '../components/SurgeryRoomDisplay';

const AdminPage = () => {
  const [rooms, setRooms] = useState([]);
  const [history, setHistory] = useState([]);

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAddSurgery = async (roomId, surgeryData) => {
    try {
      await fetch('/api/surgeries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, surgeryData }),
      });
      fetchData(); // Refetch data after adding
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
      fetchData(); // Refetch data after updating
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
      fetchData(); // Refetch data after deleting
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
      fetchData(); // Refetch data after moving
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
    />
  );
};

export default AdminPage;