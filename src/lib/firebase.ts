import { initializeApp, getApp, getApps } from 'firebase/app';

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-4256376453-c1082",
  "appId": "1:533026379543:web:233993920d55247a5cc952",
  "apiKey": "AIzaSyAifjCU46m1f-T3O9F3g7NbvHUtYTOndds",
  "authDomain": "studio-4256376453-c1082.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "533026379543"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const firebaseApp = app;
