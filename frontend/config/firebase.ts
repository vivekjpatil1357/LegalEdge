import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZf4LFi3KRc-kzEHRj9_MRPfmaFS7kz-c",
  authDomain: "legaledge-64c24.firebaseapp.com",
  projectId: "legaledge-64c24",
  storageBucket: "legaledge-64c24.firebasestorage.app",
  messagingSenderId: "659716622551",
  appId: "1:659716622551:web:8ba957d7bd92a3ada4c892",
  measurementId: "G-4HFSE5QMMX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()
export { auth, googleProvider }