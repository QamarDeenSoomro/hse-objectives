// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// =================================================================================
// IMPORTANT: FIREBASE CONFIGURATION
// =================================================================================
// This file initializes the Firebase SDK with your project's configuration.
// You need to replace the placeholder values below with your own Firebase project's credentials.
//
// To get your Firebase project configuration:
// 1. Go to the Firebase console: https://console.firebase.google.com/
// 2. Select your project (or create a new one).
// 3. In the project overview, click the "</>" icon to add a web app.
// 4. Follow the setup instructions, and you will be provided with a `firebaseConfig` object.
// 5. Copy the values from that object into the `firebaseConfig` object below.
// =================================================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your API key
  authDomain: "YOUR_AUTH_DOMAIN", // Replace with your auth domain
  projectId: "YOUR_PROJECT_ID", // Replace with your project ID
  storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your storage bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your messaging sender ID
  appId: "YOUR_APP_ID" // Replace with your app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
