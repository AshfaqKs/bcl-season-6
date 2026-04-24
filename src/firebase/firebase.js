import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBbwF9YIUhtUhr9Rg9jfMAaAJoqA-O0s3w",
    authDomain: "bcl-season-6.firebaseapp.com",
    projectId: "bcl-season-6",
    storageBucket: "bcl-season-6.firebasestorage.app",
    messagingSenderId: "641299623236",
    appId: "1:641299623236:web:b6348a480bd2a7a8e1fb11"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;