
import { NextResponse } from 'next/server';
import { db, firestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getFreshRoom } from '@/lib/maintenance';

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
    const newSurgeryId = Date.now();
    
    // Parse the incoming dateTime string and convert to Date object
    const surgeryDateTime = new Date(surgeryData.dateTime);
    
    // Validate the date
    if (isNaN(surgeryDateTime.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid dateTime format' 
      }, { status: 400 });
    }

    // Check for duplicates (Same National ID on the same day)
    if (surgeryData.nationalId) {
      const startOfDay = new Date(surgeryDateTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(surgeryDateTime);
      endOfDay.setHours(23, 59, 59, 999);

      const duplicateCheck = await firestore.collection('surgeries')
        .where('nationalId', '==', surgeryData.nationalId)
        .where('dateTime', '>=', Timestamp.fromDate(startOfDay))
        .where('dateTime', '<=', Timestamp.fromDate(endOfDay))
        .get();

      if (!duplicateCheck.empty) {
        return NextResponse.json({ 
          error: 'A surgery for this patient is already scheduled for this date.' 
        }, { status: 409 });
      }
    }
    
    const newSurgery = {
      ...surgeryData,
      id: newSurgeryId,
      roomId,
      status: 'scheduled',
      timestamp: new Date().toISOString(),
    };

    // Add the new fields to the surgery object
    if (surgeryData.gender) newSurgery.gender = surgeryData.gender;
    if (surgeryData.dob) newSurgery.dob = surgeryData.dob;
    if (surgeryData.age) newSurgery.age = surgeryData.age;
    if (surgeryData.surgeonAssistant) newSurgery.surgeonAssistant = surgeryData.surgeonAssistant;
    
    if (surgeryData.visualAcuityRight) newSurgery.visualAcuityRight = surgeryData.visualAcuityRight;
    if (surgeryData.visualAcuityLeft) newSurgery.visualAcuityLeft = surgeryData.visualAcuityLeft;
    if (surgeryData.refractionRight) newSurgery.refractionRight = surgeryData.refractionRight;
    if (surgeryData.refractionLeft) newSurgery.refractionLeft = surgeryData.refractionLeft;
    if (surgeryData.iolPowerRight) newSurgery.iolPowerRight = surgeryData.iolPowerRight;
    if (surgeryData.iolPowerLeft) newSurgery.iolPowerLeft = surgeryData.iolPowerLeft;

    // Write to Realtime DB for live view
    // Use Smart Getter to ensure DB is fresh before writing
    const room = await getFreshRoom(roomId);

    const updatedSurgeries = [...(room.surgeries || []), newSurgery].sort((a, b) =>
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

    await db.ref(`rooms/${roomId}/surgeries`).set(updatedSurgeries);

    // Write to Firestore for archive with Timestamp
    const surgeryForFirestore = {
      ...newSurgery,
      dateTime: Timestamp.fromDate(surgeryDateTime), // Convert to Firestore Timestamp
    };
    
    await firestore.collection('surgeries').doc(newSurgeryId.toString()).set(surgeryForFirestore);

    console.log('Surgery added:', {
      id: newSurgeryId,
      dateTime: surgeryDateTime.toISOString(),
      firestoreTimestamp: surgeryForFirestore.dateTime.toDate().toISOString()
    });

    return NextResponse.json(newSurgery);
  } catch (error) {
    console.error("Error in POST /api/surgeries:", error);
    return NextResponse.json({ 
      error: 'Failed to add surgery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
