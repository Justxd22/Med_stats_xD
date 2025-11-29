import { db, firestore } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Helper to format date as YYYY-MM-DD
const toYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if any surgery in the list belongs to a past date
export const hasStaleData = (surgeries: any[]) => {
  if (!surgeries || surgeries.length === 0) return false;
  const todayStr = toYYYYMMDD(new Date());
  
  return surgeries.some(surgery => {
    // Safely parse date
    try {
        const sDate = new Date(surgery.dateTime);
        const sDateStr = toYYYYMMDD(sDate);
        // Stale if strictly less than today
        return sDateStr < todayStr;
    } catch (e) {
        return false; 
    }
  });
};

export async function performDailyReset() {
  console.log(`[Maintenance] Performing Daily Reset...`);

  try {
    // 1. Wipe RTDB (Reset to default 7 empty rooms)
    const defaultRooms: any = {};
    for (let i = 1; i <= 7; i++) {
      defaultRooms[i] = { id: i, surgeries: [] };
    }
    
    // 2. Fetch Today's Surgeries from Firestore
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const firestoreSnapshot = await firestore.collection('surgeries')
      .where('dateTime', '>=', Timestamp.fromDate(startOfDay))
      .where('dateTime', '<=', Timestamp.fromDate(endOfDay))
      .get();

    // 3. Group and Hydrate
    const updates = { ...defaultRooms };
    
    firestoreSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.dateTime && typeof data.dateTime.toDate === 'function') {
        data.dateTime = data.dateTime.toDate().toISOString();
      }
      if (updates[data.roomId]) {
        updates[data.roomId].surgeries.push(data);
      }
    });

    // Sort by time
    Object.keys(updates).forEach(key => {
        if (updates[key].surgeries) {
            updates[key].surgeries.sort((a: any, b: any) => 
                new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
            );
        }
    });

    // 4. Atomic Update
    await db.ref('rooms').set(updates);

    console.log(`[Maintenance] Daily Reset Complete. Hydrated ${firestoreSnapshot.size} surgeries.`);

  } catch (error) {
    console.error("[Maintenance] Failed to reset DB:", error);
  }
}

// Smart Getter: Fetches room, checks for staleness, resets if needed, returns fresh data
export async function getFreshRoom(roomId: string | number) {
    let roomRef = db.ref(`rooms/${roomId}`);
    let snapshot = await roomRef.once('value');
    let room = snapshot.val();

    if (room && room.surgeries && hasStaleData(room.surgeries)) {
        console.log(`[Maintenance] Stale data detected in Room ${roomId}. Triggering reset.`);
        await performDailyReset();
        
        // Refetch after reset
        snapshot = await roomRef.once('value');
        room = snapshot.val();
    }

    return room || { id: roomId, surgeries: [] };
}