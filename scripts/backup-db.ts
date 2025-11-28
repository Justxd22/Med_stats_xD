
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env
const result = dotenv.config({ path: '.env' });

if (result.error) {
  console.warn("⚠️ Could not load .env file:", result.error.message);
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error("❌ Error: FIREBASE_PRIVATE_KEY is missing from environment variables.");
  console.error("Ensure .env exists and contains your Firebase credentials.");
  process.exit(1);
}


import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();
const firestore = admin.firestore();

async function backup() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupDir = path.join(process.cwd(), 'DB_BACKUPS');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  console.log(`Starting backup for ${today}...`);

  // --- 1. Backup Realtime Database ---
  try {
    console.log('Backing up Realtime Database...');
    const snapshot = await db.ref('/').once('value');
    const rtdbData = snapshot.val();
    
    const rtdbFilename = path.join(backupDir, `rtdb_${today}.json`);
    fs.writeFileSync(rtdbFilename, JSON.stringify(rtdbData, null, 2));
    console.log(`✅ RTDB backup saved to ${rtdbFilename}`);
  } catch (error) {
    console.error('❌ Failed to backup RTDB:', error);
  }

  // --- 2. Backup Firestore ---
  try {
    console.log('Backing up Firestore...');
    const collections = await firestore.listCollections();
    const firestoreData: Record<string, any> = {};

    for (const collection of collections) {
      const snapshot = await collection.get();
      firestoreData[collection.id] = {};
      
      snapshot.forEach(doc => {
        firestoreData[collection.id][doc.id] = doc.data();
      });
    }

    const firestoreFilename = path.join(backupDir, `firestore_${today}.json`);
    fs.writeFileSync(firestoreFilename, JSON.stringify(firestoreData, null, 2));
    console.log(`✅ Firestore backup saved to ${firestoreFilename}`);
  } catch (error) {
    console.error('❌ Failed to backup Firestore:', error);
  }

  console.log('Backup process completed.');
  process.exit(0);
}

backup();
