import { NextResponse } from 'next/server';
import { db, firestore } from '../../../../lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { surgeryId, sourceRoomId, destinationRoomId } = await request.json();

    // --- Realtime Database (Live) --- 
    const sourceRoomRef = db.ref(`rooms/${sourceRoomId}`);
    const sourceSnapshot = await sourceRoomRef.once('value');
    const sourceRoom = sourceSnapshot.val();

    const surgeryToMove = sourceRoom.surgeries.find((s: any) => s.id.toString() === surgeryId);

    if (!surgeryToMove) {
      return NextResponse.json({ error: 'Surgery not found' }, { status: 404 });
    }

    const updatedSourceSurgeries = sourceRoom.surgeries.filter((s: any) => s.id.toString() !== surgeryId);
    
    const destinationRoomRef = db.ref(`rooms/${destinationRoomId}`);
    const destinationSnapshot = await destinationRoomRef.once('value');
    const destinationRoom = destinationSnapshot.val();

    // Check if surgery already exists in destination to prevent duplicates
    const alreadyInDest = destinationRoom.surgeries?.some((s: any) => s.id.toString() === surgeryId);
    
    let updatedDestinationSurgeries;
    if (alreadyInDest) {
      updatedDestinationSurgeries = destinationRoom.surgeries;
    } else {
      updatedDestinationSurgeries = [...(destinationRoom.surgeries || []), { ...surgeryToMove, roomId: destinationRoomId }];
    }

    const liveUpdates = {};
    liveUpdates[`/rooms/${sourceRoomId}/surgeries`] = updatedSourceSurgeries;
    liveUpdates[`/rooms/${destinationRoomId}/surgeries`] = updatedDestinationSurgeries;
    
    await db.ref().update(liveUpdates);

    // --- Firestore (Archive) ---
    await firestore.collection('surgeries').doc(surgeryId).update({ roomId: destinationRoomId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error moving surgery:", error);
    return NextResponse.json({ error: 'Failed to move surgery' }, { status: 500 });
  }
}
