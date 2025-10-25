import { NextResponse } from 'next/server';
import { firestore } from '../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  if (!startDateStr || !endDateStr) {
    return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
  }

  try {
    // Parse the input dates (they come as "2025-10-21")
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
    
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    console.log('Query range:');
    console.log('Start:', startDate.toISOString());
    console.log('End:', endDate.toISOString());
    console.log('Start Timestamp:', startTimestamp.toDate().toISOString());
    console.log('End Timestamp:', endTimestamp.toDate().toISOString());
    
    const surgeriesRef = firestore.collection('surgeries');
    
    // First, let's see what we have
    const allDocs = await surgeriesRef.limit(5).get();
    console.log('Sample documents in DB:');
    allDocs.docs.forEach(doc => {
      const data = doc.data();
      console.log('Doc ID:', doc.id);
      console.log('dateTime:', data.dateTime);
      if (data.dateTime instanceof Timestamp) {
        console.log('dateTime as ISO:', data.dateTime.toDate().toISOString());
      }
    });
    
    const snapshot = await surgeriesRef
      .where('dateTime', '>=', startTimestamp)
      .where('dateTime', '<=', endTimestamp)
      .get();

    console.log(`Found ${snapshot.size} documents matching query`);

    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const surgeries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateTime: data.dateTime instanceof Timestamp 
          ? data.dateTime.toDate().toISOString() 
          : data.dateTime
      };
    });
    
    return NextResponse.json(surgeries);
  } catch (error) {
    console.error("Error fetching archived surgeries:", error);
    return NextResponse.json({ 
      error: 'Failed to fetch archived data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}