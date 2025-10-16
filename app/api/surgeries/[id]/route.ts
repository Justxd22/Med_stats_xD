import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase-admin';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surgeryId } = await params;
    const { roomId, newStatus } = await request.json();

    const roomRef = db.ref(`rooms/${roomId}`);
    const snapshot = await roomRef.once('value');
    const room = snapshot.val();

    const updatedSurgeries = room.surgeries.map((s: any) =>
      s.id.toString() === surgeryId ? { ...s, status: newStatus } : s
    );

    await roomRef.child('surgeries').set(updatedSurgeries);

    const historyRef = db.ref(`history/${surgeryId}`);
    await historyRef.update({ status: newStatus });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update surgery' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surgeryId } = await params;
    const { roomId } = await request.json();

    const roomRef = db.ref(`rooms/${roomId}`);
    const snapshot = await roomRef.once('value');
    const room = snapshot.val();

    const updatedSurgeries = room.surgeries.filter((s: any) => s.id.toString() !== surgeryId);

    await roomRef.child('surgeries').set(updatedSurgeries);

    const historyRef = db.ref(`history/${surgeryId}`);
    await historyRef.remove();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete surgery' }, { status: 500 });
  }
}