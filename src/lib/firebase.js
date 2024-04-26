import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "chatapp-sai21.firebaseapp.com",
  projectId: "chatapp-sai21",
  storageBucket: "chatapp-sai21.appspot.com",
  messagingSenderId: "847003562356",
  appId: "1:847003562356:web:9909b11253725ca870bc21",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
