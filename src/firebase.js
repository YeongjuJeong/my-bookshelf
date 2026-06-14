import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCYJPFgefQuSQu4eC_TDB84xtadpI7AOa4",
    authDomain: "my-bookshelf-1d23c.firebaseapp.com",
    projectId: "my-bookshelf-1d23c",
    storageBucket: "my-bookshelf-1d23c.firebasestorage.app",
    messagingSenderId: "910141919526",
    appId: "1:910141919526:web:7b69ff3469bf8143ff71e7",
    measurementId: "G-QX4PNBNK2X"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();