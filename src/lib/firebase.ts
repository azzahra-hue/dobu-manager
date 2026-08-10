import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "maximal-simplicity-n8gvj",
  appId: "1:511796686447:web:8732e38efd73bd77bb279a",
  apiKey: "AIzaSyDCI91aDvMrREuWXey-8lssNkIPWZsvmtk",
  authDomain: "maximal-simplicity-n8gvj.firebaseapp.com",
  storageBucket: "maximal-simplicity-n8gvj.firebasestorage.app",
  messagingSenderId: "511796686447"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID
export const db = getFirestore(app, "ai-studio-manajerusahakuli-0e41d73e-f7d3-441c-9f1a-c0a65ba30cb9");
