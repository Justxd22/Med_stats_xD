import { NextResponse } from 'next/server';
import { db, firestore } from '@/lib/firebase-admin';
import { getFreshRoom } from '@/lib/maintenance';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const { roomId, newStatus } = await request.json();

  try {
    // Smart Fetch (Clean if stale)
    const room = await getFreshRoom(roomId);

    if (!room || !room.surgeries) {
       return NextResponse.json({ error: 'Room not found or empty' }, { status: 404 });
    }

    const updatedSurgeries = room.surgeries.map((s: any) => {
      if (s.id.toString() === id) {
        return { ...s, status: newStatus };
      }
      return s;
    });

    await db.ref(`rooms/${roomId}/surgeries`).set(updatedSurgeries);

    // Update Firestore
    await firestore.collection('surgeries').doc(id).update({ status: newStatus });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating surgery:", error);
    return NextResponse.json({ error: 'Failed to update surgery' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const { roomId } = await request.json();

  try {
    // Smart Fetch (Clean if stale)
    const room = await getFreshRoom(roomId);
    
    if (!room || !room.surgeries) {
       return NextResponse.json({ success: true }); // Already gone or empty
    }

    const updatedSurgeries = room.surgeries.filter((s: any) => s.id.toString() !== id);

    await db.ref(`rooms/${roomId}/surgeries`).set(updatedSurgeries);

    // Remove from Firestore
    await firestore.collection('surgeries').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting surgery:", error);
    return NextResponse.json({ error: 'Failed to delete surgery' }, { status: 500 });
  }
}