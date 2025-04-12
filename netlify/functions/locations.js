require("dotenv").config();

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

let db;

// Only initialize if not already initialized
if (!getApps().length) {
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
  db = getFirestore(app);
} else {
  db = getFirestore(); // reuse the existing default app
}


exports.handler = async function (event, context) {
  try {
    const snapshot = await db
      .collection('schedule')
      .orderBy('date')
      .limit(10) // for now, limit for testing
      .get();

    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date?.toDate().toISOString() || '',
        location: {
          address: data.location?.address || '',
          latitude: data.location?.latitude || null,
          longitude: data.location?.longitude || null,
        },
        startTime: data.startTime?.toDate().toISOString() || '',
        endTime: data.endTime?.toDate().toISOString() || '',
        menuItems: data.menuItems || [],
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, locations: results }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
};
