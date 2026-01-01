import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * CONFIGURATION FIREBASE RÉELLE - CMC ORIENTAL
 * Ces clés lient l'application à votre console Firebase.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBxVxVOI81XB1Fs2mhoG3dL0SASAOO6N2U",
  authDomain: "cmc-oriental-app.firebaseapp.com",
  projectId: "cmc-oriental-app",
  storageBucket: "cmc-oriental-app.firebasestorage.app",
  messagingSenderId: "708143742384",
  appId: "1:708143742384:web:8be08c1f2b0d68d798ea75"
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

// Exportation des services pour utilisation dans les pages
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configuration du fournisseur Google
export const googleProvider = new GoogleAuthProvider();
// On force la sélection du compte pour éviter les connexions automatiques indésirables
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;