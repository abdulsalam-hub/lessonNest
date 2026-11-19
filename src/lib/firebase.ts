import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

let services: { app: FirebaseApp; auth: Auth; db: Firestore } | undefined

export function getFirebaseServices() {
  if (services) return services

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  }

  const missingConfig = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingConfig.length) {
    throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`)
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  services = { app, auth: getAuth(app), db: getFirestore(app) }
  return services
}
