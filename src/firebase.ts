import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0Hn-72PnfupGLvu4zJfvcgda-vfabxZE",
  authDomain: "rey-kasa.firebaseapp.com",
  projectId: "rey-kasa",
  storageBucket: "rey-kasa.firebasestorage.app",
  messagingSenderId: "18814034039",
  appId: "1:18814034039:web:b851124b35148fcb3c2672",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;