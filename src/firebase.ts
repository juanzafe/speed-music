import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDzck_SKp_jeh0dAEmFyiWvbuw1SB43KwY",
  authDomain: "speed-music-noe.firebaseapp.com",
  databaseURL: "https://speed-music-noe-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "speed-music-noe",
  storageBucket: "speed-music-noe.firebasestorage.app",
  messagingSenderId: "450457958799",
  appId: "1:450457958799:web:edcd772eeb34259343f3fa",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
