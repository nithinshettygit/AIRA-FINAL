// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // optional

// Your web app's Firebase configuration (from Firebase settings)
const firebaseConfig = {
  apiKey: "AIzaSyBHZcoSOeJIhrCSaMxIbakD9NufHhYz5FQ",
  authDomain: "aira-59bf3.firebaseapp.com",
  projectId: "aira-59bf3",
  storageBucket: "aira-59bf3.appspot.com",   // ✅ fixed format
  messagingSenderId: "3165149402",
  appId: "1:3165149402:web:a22d64a0ae1bd58532ede3",
  measurementId: "G-N3R00BG44D" // optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase Authentication
export const auth = getAuth(app);

// ✅ Initialize Cloud Firestore
export const db = getFirestore(app);

// ✅ Optional: Analytics (only if you really want it)
// const analytics = getAnalytics(app);

export default app;
