import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD6QxQ5Y324j0MiHfeazpzDaIpMGAm4IP8",
  authDomain: "chatapp-sai7.firebaseapp.com",
  projectId: "chatapp-sai7",
  storageBucket: "chatapp-sai7.appspot.com",
  messagingSenderId: "206612834613",
  appId: "1:206612834613:web:25c1171c423f007f59c47c",
  measurementId: "G-VDJPXSCR65"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
