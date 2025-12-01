// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración web de Firebase (copiada de tu imagen)
const firebaseConfig = {
  apiKey: "AIzaSyCDGRFAuOwMvy6M66eBW7ibQmKqqVmm-TE",
  authDomain: "coar-puno-app.firebaseapp.com",
  projectId: "coar-puno-app",
  storageBucket: "coar-puno-app.firebasestorage.app",
  messagingSenderId: "2085536100",
  appId: "1:2085536100:web:fac96655b6ffa10209fa71",
  measurementId: "G-N8YTE0W98P"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar y exportar la Base de Datos (Firestore)
export const db = getFirestore(app);
