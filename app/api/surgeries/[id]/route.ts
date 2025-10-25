import { NextResponse } from 'next/server';
import { db, firestore } from '../../../../lib/firebase-admin';

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const { roomId, newStatus } = await request.json();
    const surgeryId = context.params.id;

    // Update Realtime DB
    const roomRef = db.ref(`rooms/${roomId}`);
    const snapshot = await roomRef.once('value');
    const room = snapshot.val();

    const updatedSurgeries = room.surgeries.map((s: any) =>
      s.id.toString() === surgeryId ? { ...s, status: newStatus } : s
    );
    await roomRef.child('surgeries').set(updatedSurgeries);

    // Update Firestore
    await firestore.collection('surgeries').doc(surgeryId).update({ status: newStatus });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update surgery' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const { roomId } = await request.json();
    const surgeryId = context.params.id;

    // Update Realtime DB
    const roomRef = db.ref(`rooms/${roomId}`);
    const snapshot = await roomRef.once('value');
    const room = snapshot.val();

    const updatedSurgeries = room.surgeries.filter((s: any) => s.id.toString() !== surgeryId);

    await roomRef.child('surgeries').set(updatedSurgeries);

    // Delete from Firestore
    await firestore.collection('surgeries').doc(surgeryId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete surgery' }, { status: 500 });
  }
}