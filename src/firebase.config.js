import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC3-Pg05Fozw6cxk1S0Dk8litUePHpsXS0",
  authDomain: "passeimentoria-v1-b4e15.firebaseapp.com",
  projectId: "passeimentoria-v1-b4e15",
  storageBucket: "passeimentoria-v1-b4e15.firebasestorage.app",
  messagingSenderId: "14500100992",
  appId: "1:14500100992:web:998347e46b4bd819155f65"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;