import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const targetUid = process.argv[2]
const expectedEmail = 'abdulsalamthunde@gmail.com'

if (!targetUid) {
  console.error('Usage: node scripts/set-admin-claim.mjs <FIREBASE_USER_UID>')
  process.exit(1)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of your local service-account JSON file.')
  process.exit(1)
}

const app = initializeApp({
  credential: applicationDefault(),
})

try {
  const auth = getAuth(app)
  const user = await auth.getUser(targetUid)

  if (user.email?.toLowerCase() !== expectedEmail) {
    throw new Error(
      `UID email mismatch. Expected ${expectedEmail}, but Firebase returned ${user.email ?? 'no email'}.`,
    )
  }

  const existingClaims = user.customClaims ?? {}
  await auth.setCustomUserClaims(targetUid, {
    ...existingClaims,
    admin: true,
  })

  console.log(`Administrator claim successfully assigned to ${expectedEmail}.`)
  console.log('Sign out and sign back in, then visit /admin to verify access.')
} catch (error) {
  console.error('Could not assign administrator access:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await app.delete()
}
