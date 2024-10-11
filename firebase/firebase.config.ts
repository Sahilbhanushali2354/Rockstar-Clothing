// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvzUyJhgr5ur2GCufPoUxVoe1xJRmgLsk",
  authDomain: "rockstar-clothing-859c4.firebaseapp.com",
  projectId: "rockstar-clothing-859c4",
  storageBucket: "rockstar-clothing-859c4.appspot.com",
  messagingSenderId: "89378510531",
  appId: "1:89378510531:web:1ad1c0919f77f1caec3476",
  measurementId: "G-64X05KEG1Z",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const FStore = getFirestore(app);
export const auth = getAuth(app);
const analytics = getAnalytics(app);
