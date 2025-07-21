// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCdYQhEdbBjl-D9euJgjkQuRSb2WaJvZZc",
  authDomain: "talking-tanuki.firebaseapp.com",
  projectId: "talking-tanuki",
  storageBucket: "talking-tanuki.firebasestorage.app",
  messagingSenderId: "38602504569",
  appId: "1:38602504569:web:2aa963639a6ac6f8db17a8",
  measurementId: "G-05DETY4422"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);