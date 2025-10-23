
import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function GET() {
  try {
    const roomsRef = db.ref('rooms');
    const snapshot = await roomsRef.once('value');
    const data = snapshot.val();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { roomId, surgeryData } = await request.json();
    const newSurgery = {
      ...surgeryData,
      id: Date.now(),
      roomId,
      status: 'scheduled',
      timestamp: new Date().toISOString(),
    };

    const roomRef = db.ref(`rooms/${roomId}`);
    const snapshot = await roomRef.once('value');
    const room = snapshot.val();

    const updatedSurgeries = [...(room.surgeries || []), newSurgery].sort((a, b) =>
      new Date(a.dateTime) - new Date(b.dateTime)
    );

    await roomRef.child('surgeries').set(updatedSurgeries);

    const historyRef = db.ref(`history/${newSurgery.id}`);
    await historyRef.set(newSurgery);

    return NextResponse.json(newSurgery);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add surgery' }, { status: 500 });
  }
}
