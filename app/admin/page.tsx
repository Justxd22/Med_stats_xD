"use client";
import React, { useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to track current displayDate for event listeners
  const displayDateRef = React.useRef(displayDate);
  
  useEffect(() => {
    displayDateRef.current = displayDate;
  }, [displayDate]);

  const isToday = toYYYYMMDD(new Date()) === toYYYYMMDD(displayDate);
  
  // Calculate if the displayed date is in the past (strictly less than today)
  const todayString = toYYYYMMDD(new Date());
  const displayString = toYYYYMMDD(displayDate);
  const isPast = displayString < todayString;
  
  // Editable logic: not past date
  const isEditable = !isPast;

  // Helper to deduplicate surgeries
  const deduplicateSurgeries = useCallback((roomsData) => {
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
  }, []);

  const mergeWithDefaultRooms = useCallback((fetchedRooms) => {
    const defaultRooms = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, surgeries: [] }));
    return defaultRooms.map(defaultRoom => {
      const foundRoom = fetchedRooms.find((r: any) => Number(r.id) === Number(defaultRoom.id));
      return foundRoom ? { ...defaultRoom, ...foundRoom } : defaultRoom;
    });
  }, []);

  // Automatically sync history whenever rooms change
  useEffect(() => {
    const allSurgeries = rooms.flatMap((room: any) => room.surgeries || []);
    setHistory(allSurgeries);
  }, [rooms]);

  const fetchArchivedData = useCallback((date) => {
    setIsLoading(true);
    fetch(`/api/archive?date=${toYYYYMMDD(date)}`)
      .then(res => res.json())
      .then(data => {
        let uniqueRooms = [];
        if (data && data.rooms && Object.keys(data.rooms).length > 0) {
          uniqueRooms = deduplicateSurgeries(data.rooms);
        }
        
        const finalRooms = mergeWithDefaultRooms(uniqueRooms);
        setRooms(finalRooms);
        setIsLoading(false);
        // setHistory is handled by useEffect
      })
      .catch(error => {
        console.error('Failed to fetch archived data', error);
        const defaultRooms = mergeWithDefaultRooms([]);
        setRooms(defaultRooms);
        setIsLoading(false);
      });
  }, [deduplicateSurgeries, mergeWithDefaultRooms]);

  useEffect(() => {
    if (isToday) {
      const roomsRef = ref(database, 'rooms');
      const unsubscribe = onValue(roomsRef, (snapshot) => {
        // Zombie Listener Check: Ensure we are still on "Today"
        const currentDisplayDate = displayDateRef.current;
        const actuallyToday = toYYYYMMDD(new Date()) === toYYYYMMDD(currentDisplayDate);
        if (!actuallyToday) {
           return;
        }

        const data = snapshot.val();
        let processedRooms = [];
        if (data) {
          const todayStr = toYYYYMMDD(new Date());
          // First deduplicate
          processedRooms = deduplicateSurgeries(data);

          // Then filter for today
          processedRooms = processedRooms.map((room: any) => {
            if (room.surgeries) {
              room.surgeries = room.surgeries.filter(surgery => toYYYYMMDD(new Date(surgery.dateTime)) === todayStr);
            }
            return room;
          });
        }
        
        const finalRooms = mergeWithDefaultRooms(processedRooms);
        setRooms(finalRooms);
        setIsLoading(false);
      });
      
      return () => unsubscribe();
    } else {
      fetchArchivedData(displayDate);
    }
  }, [displayDate, isToday, deduplicateSurgeries, fetchArchivedData, mergeWithDefaultRooms]);

  const handlePrevDay = () => {
    setIsLoading(true);
    setDisplayDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setIsLoading(true);
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
      
      const newSurgery = await res.json();

      // Update local state directly (Optimistic-like UI)
      setRooms(prevRooms => {
        return prevRooms.map((room: any) => {
           if (String(room.id) === String(roomId)) {
             const updatedSurgeries = [...(room.surgeries || []), newSurgery].sort((a, b) => 
                new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
             );
             return { ...room, surgeries: updatedSurgeries };
           }
           return room;
        });
      });

    } catch (error) {
      console.error('Failed to add surgery', error);
      alert('Failed to add surgery. Please try again.');
    }
  };

  const handleStatusChange = async (roomId, surgeryId, newStatus) => {
    // 1. Optimistic Update
    const previousRooms = [...rooms];
    setRooms(prevRooms => {
      return prevRooms.map((room: any) => {
        if (String(room.id) === String(roomId)) {
          return {
            ...room,
            surgeries: room.surgeries ? room.surgeries.map((s: any) => {
              if (String(s.id) === String(surgeryId)) {
                return { ...s, status: newStatus };
              }
              return s;
            }) : []
          };
        }
        return room;
      });
    });

    try {
      await fetch(`/api/surgeries/${surgeryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, newStatus }),
      });
    } catch (error) {
      console.error('Failed to update surgery', error);
      // Revert on failure
      setRooms(previousRooms);
      alert("Failed to update status. Reverting changes.");
    }
  };

  const handleRemoveSurgery = async (roomId, surgeryId) => {
    // 1. Optimistic Update
    const previousRooms = [...rooms];
    setRooms(prevRooms => {
       return prevRooms.map((room: any) => {
          if (String(room.id) === String(roomId)) {
             return { 
               ...room, 
               surgeries: room.surgeries ? room.surgeries.filter((s: any) => String(s.id) !== String(surgeryId)) : [] 
             };
          }
          return room;
       });
    });

    try {
      const res = await fetch(`/api/surgeries/${surgeryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      
      if (!res.ok) {
         throw new Error('Failed to delete');
      }
      
    } catch (error) {
      console.error('Failed to delete surgery', error);
      // Revert on failure
      setRooms(previousRooms);
      alert("Failed to delete surgery. Reverting changes.");
    }
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

  return (
    <SurgeryRoomDisplay 
      rooms={rooms}
      history={history}
      handleAddSurgery={handleAddSurgery}
      handleStatusChange={handleStatusChange}
      handleRemoveSurgery={handleRemoveSurgery}
      handleMoveSurgery={handleMoveSurgery}
      isAdmin={true}
      isEditable={isEditable}
      displayDate={displayDate}
      handlePrevDay={handlePrevDay}
      handleNextDay={handleNextDay}
      isToday={isToday}
      isLoading={isLoading}
    />
  );
};

export default AdminPage;