import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyA8sOxBXcxxPYU6Va8_3wpWNPihUaG0yYk",
  authDomain: "systemapp-9103f.firebaseapp.com",
  projectId: "systemapp-9103f",
  storageBucket: "systemapp-9103f.firebasestorage.app",
  messagingSenderId: "18054856613",
  appId: "1:18054856613:web:baa6af8148c9fd9397b24c",
  measurementId: "G-V4Y6313YBX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

export default app;