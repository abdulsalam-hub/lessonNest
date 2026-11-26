import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

let adminAuth: Auth | undefined

export function getFirebaseAdminAuth(): Auth {
  if (adminAuth) return adminAuth

  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!rawCredentials) {
    throw new Error('Firebase service-account credentials are missing.')
  }

  let serviceAccount: {
    project_id?: string
    client_email?: string
    private_key?: string
  }

  try {
    serviceAccount = JSON.parse(rawCredentials)
  } catch {
    throw new Error('Firebase service-account credentials are not valid JSON.')
  }

  if (
    serviceAccount.project_id !== 'lessonnest-234' ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw new Error('Firebase service-account credentials do not match this project.')
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        }),
      })

  adminAuth = getAuth(app)
  return adminAuth
}
