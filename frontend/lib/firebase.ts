import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import firebaseAppletConfig from "@/firebase-applet-config.json";

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configure Google Auth Provider for Standard Sign-In
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope("profile");
googleAuthProvider.addScope("email");

// Optional Workspace Auth Provider (for users whose organization policy permits sensitive scopes)
export const googleWorkspaceAuthProvider = new GoogleAuthProvider();
googleWorkspaceAuthProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
googleWorkspaceAuthProvider.addScope("https://www.googleapis.com/auth/documents");
googleWorkspaceAuthProvider.addScope("https://www.googleapis.com/auth/drive.file");
googleWorkspaceAuthProvider.addScope("https://www.googleapis.com/auth/calendar");

export default app;
