import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAS0wYe6RssuFxtWxqeyNcu7XwB_1AO3XI",
  authDomain: "kanavu-d8379.firebaseapp.com",
  databaseURL: "https://kanavu-d8379-default-rtdb.firebaseio.com",
  projectId: "kanavu-d8379",
  storageBucket: "kanavu-d8379.firebasestorage.app",
  messagingSenderId: "112860183771",
  appId: "1:112860183771:web:40b12359dc7b916acd20fe",
  measurementId: "G-08LBRH0FZL"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDB = getDatabase(app);
export const storage = getStorage(app);

// Analytics (optional, only if supported in browser)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
