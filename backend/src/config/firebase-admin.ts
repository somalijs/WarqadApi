import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

// --- Validate and prepare environment variables ---
// This makes the initialization more robust by checking for missing vars.
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Replace escaped newlines
const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const clientId = process.env.FIREBASE_CLIENT_ID;
const clientX509CertUrl = process.env.FIREBASE_CLIENT_X509_CERT_URL;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (
  !projectId ||
  !privateKey ||
  !privateKeyId ||
  !clientEmail ||
  !clientId ||
  !clientX509CertUrl ||
  !storageBucket
) {
  console.error(
    'Missing one or more critical Firebase Admin environment variables. Please check your .env file.'
  );
  // Exit or throw an error to prevent the app from starting with invalid credentials
  process.exit(1);
}
console.log(storageBucket);
// --- Initialize Firebase Admin SDK ---
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: 'service_account',
      project_id: projectId,
      private_key_id: privateKeyId,
      private_key: privateKey,
      client_email: clientEmail,
      client_id: clientId,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: clientX509CertUrl,
    } as any), // Type assertion to ensure correct structure
    storageBucket: storageBucket,
  });
  console.log('Firebase Admin SDK initialized successfully!');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1); // Exit if initialization fails
}

// Export the storage bucket for use in other parts of your application
const bucket = admin.storage().bucket();

export default bucket;

// You can now export other services as needed, e.g.:
// export const db = admin.firestore();
// export const auth = admin.auth();
