import { NextResponse } from 'next/server';
import { firestore } from '../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  let startDate, endDate;

  if (dateStr) {
    // Handle single-date query
    startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);
  } else if (startDateStr && endDateStr) {
    // Handle date-range query
    startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
  } else {
    return NextResponse.json({ error: 'Missing date parameters' }, { status: 400 });
  }

  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const surgeriesRef = firestore.collection('surgeries');
    const snapshot = await surgeriesRef
      .where('dateTime', '>=', startTimestamp)
      .where('dateTime', '<=', endTimestamp)
      .get();

    // For single-date requests, we need to return the full rooms object structure
    if (dateStr) {
        if (snapshot.empty) {
            return NextResponse.json({ rooms: {} });
        }
        const surgeries = snapshot.docs.map(doc => {
            const data = doc.data();
            return { ...data, dateTime: data.dateTime.toDate().toISOString() };
        });

        const rooms = {};
        surgeries.forEach(surgery => {
            const { roomId } = surgery;
            if (!rooms[roomId]) {
                rooms[roomId] = { id: roomId, surgeries: [] };
            }
            rooms[roomId].surgeries.push(surgery);
        });

        Object.keys(rooms).forEach(roomId => {
            const roomNumber = parseInt(roomId, 10);
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500'];
            rooms[roomId].color = colors[(roomNumber - 1) % colors.length];
        });

        return NextResponse.json({ rooms });
    }

    // For date-range requests (export), return a flat array
    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const surgeries = snapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, dateTime: data.dateTime.toDate().toISOString() };
    });
    
    return NextResponse.json(surgeries);

  } catch (error) {
    console.error("Error fetching archived surgeries:", error);
    return NextResponse.json({ error: 'Failed to fetch archived data' }, { status: 500 });
  }
}