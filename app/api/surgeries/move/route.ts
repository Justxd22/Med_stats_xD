import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { surgeryId, sourceRoomId, destinationRoomId } = await request.json();

    const sourceRoomRef = db.ref(`rooms/${sourceRoomId}`);
    const sourceSnapshot = await sourceRoomRef.once('value');
    const sourceRoom = sourceSnapshot.val();

    const destinationRoomRef = db.ref(`rooms/${destinationRoomId}`);
    const destinationSnapshot = await destinationRoomRef.once('value');
    const destinationRoom = destinationSnapshot.val();

    const surgeryToMove = sourceRoom.surgeries.find((s: any) => s.id.toString() === surgeryId);

    if (!surgeryToMove) {
      return NextResponse.json({ error: 'Surgery not found' }, { status: 404 });
    }

    const updatedSourceSurgeries = sourceRoom.surgeries.filter((s: any) => s.id.toString() !== surgeryId);

    const updatedDestinationSurgeries = [...(destinationRoom.surgeries || []), { ...surgeryToMove, roomId: destinationRoomId }];

    const updates = {};
    updates[`/rooms/${sourceRoomId}/surgeries`] = updatedSourceSurgeries;
    updates[`/rooms/${destinationRoomId}/surgeries`] = updatedDestinationSurgeries;
    updates[`/history/${surgeryId}/roomId`] = destinationRoomId;


    await db.ref().update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to move surgery' }, { status: 500 });
  }
}
