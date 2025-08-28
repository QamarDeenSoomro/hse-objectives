// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add your own Firebase configuration from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyAIeAfGNHZpMSpWlMGi-tphyBm86bTcTu4",
  authDomain: "hse-objectives.firebaseapp.com",
  projectId: "hse-objectives",
  storageBucket: "hse-objectives.firebasestorage.app",
  messagingSenderId: "921525802344",
  appId: "1:921525802344:web:e329d7aa5f87d0581db2dd",
  measurementId: "G-P1J75X1ZHQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
