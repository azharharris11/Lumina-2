
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKfFRG53GggBNgMyEuBGy-FJKFf4Eqni8",
  authDomain: "lumina-f7d88.firebaseapp.com",
  projectId: "lumina-f7d88",
  storageBucket: "lumina-f7d88.firebasestorage.app",
  messagingSenderId: "31263065340",
  appId: "1:31263065340:web:b7857a93cec5a70565c379",
  measurementId: "G-BRW8RLKY2X"
};

// Initialize Firebase
// Singleton pattern to prevent hot-reload errors in development
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent cache settings directly (Modern Approach)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Mock Auth Implementation
// Used to bypass firebase/auth module errors while maintaining app flow
const authListeners: ((user: any) => void)[] = [];
const notifyAuthListeners = (user: any) => authListeners.forEach(l => l(user));

const auth = {
    currentUser: JSON.parse(localStorage.getItem('lumina_mock_user') || 'null'),
    onAuthStateChanged: (callback: (user: any) => void) => {
        authListeners.push(callback);
        callback(auth.currentUser);
        return () => {
            const idx = authListeners.indexOf(callback);
            if (idx > -1) authListeners.splice(idx, 1);
        };
    },
    signOut: async () => {
        localStorage.removeItem('lumina_mock_user');
        auth.currentUser = null;
        notifyAuthListeners(null);
    },
    signInMock: (user: any) => {
        localStorage.setItem('lumina_mock_user', JSON.stringify(user));
        auth.currentUser = user;
        notifyAuthListeners(user);
    }
};

const googleProvider = { setCustomParameters: () => {} };

export { auth, db, googleProvider };
