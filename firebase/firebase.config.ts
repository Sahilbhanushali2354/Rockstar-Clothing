import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAvzUyJhgr5ur2GCufPoUxVoe1xJRmgLsk",
  authDomain: "rockstar-clothing-859c4  .firebaseapp.com",
  projectId: "rockstar-clothing-859c4",
  storageBucket: "rockstar-clothing-859c4.appspot.com",
  messagingSenderId: "89378510531",
  appId: "1:89378510531:web:1ad1c0919f77f1caec3476",
  measurementId: "G-64X05KEG1Z",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const FStore = getFirestore(app);
export const storage = getStorage(app);