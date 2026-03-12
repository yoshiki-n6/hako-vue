import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKDmft954eO5g5CGJOKPHdKQH9dZhJy3I",
  authDomain: "hako-vue.firebaseapp.com",
  projectId: "hako-vue",
  storageBucket: "hako-vue.firebasestorage.app",
  messagingSenderId: "574839817132",
  appId: "1:574839817132:web:9af8e1eb76bbe8abab7009"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
