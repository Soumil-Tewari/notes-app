import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  
  apiKey: "AIzaSyA_sHExnGjBrJSVxW8KIcON1dho9m4wzNk",
  authDomain: "notesapp-4928b.firebaseapp.com",
  projectId: "notesapp-4928b",
  storageBucket: "notesapp-4928b.firebasestorage.app",
  messagingSenderId: "503670653664",
  appId: "1:503670653664:web:9529dddb70bfac21be8685",
  measurementId: "G-0BZ6755SSQ"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);

