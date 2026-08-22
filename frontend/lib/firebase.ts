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

// Configure Google Auth Provider with Workspace Scopes
export const googleAuthProvider = new GoogleAuthProvider();

// Gmail Scopes
googleAuthProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
googleAuthProvider.addScope("https://www.googleapis.com/auth/gmail.send");
googleAuthProvider.addScope("https://www.googleapis.com/auth/gmail.compose");

// Google Forms Scopes
googleAuthProvider.addScope("https://www.googleapis.com/auth/forms.body");
googleAuthProvider.addScope("https://www.googleapis.com/auth/forms.body.readonly");
googleAuthProvider.addScope("https://www.googleapis.com/auth/forms.responses.readonly");

// Google Docs & Drive Scopes
googleAuthProvider.addScope("https://www.googleapis.com/auth/documents");
googleAuthProvider.addScope("https://www.googleapis.com/auth/documents.readonly");
googleAuthProvider.addScope("https://www.googleapis.com/auth/drive.readonly");
googleAuthProvider.addScope("https://www.googleapis.com/auth/drive.file");

// Google Calendar Scopes
googleAuthProvider.addScope("https://www.googleapis.com/auth/calendar");
googleAuthProvider.addScope("https://www.googleapis.com/auth/calendar.events");
googleAuthProvider.addScope("https://www.googleapis.com/auth/calendar.events.readonly");

// Google Chat Scopes
googleAuthProvider.addScope("https://www.googleapis.com/auth/chat.spaces");
googleAuthProvider.addScope("https://www.googleapis.com/auth/chat.spaces.readonly");
googleAuthProvider.addScope("https://www.googleapis.com/auth/chat.messages");
googleAuthProvider.addScope("https://www.googleapis.com/auth/chat.messages.readonly");

export default app;
