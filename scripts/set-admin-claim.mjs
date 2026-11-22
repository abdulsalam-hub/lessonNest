import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const targetUid = process.argv[2]
const expectedEmail = 'abdulsalamthunde@gmail.com'

if (!targetUid) {
  console.error('Usage: node scripts/set-admin-claim.mjs <FIREBASE_USER_UID>')
  process.exit(1)
}

// Uses Application Default Credentials. In Google Cloud Shell, these are
// provided by the authenticated Google account; no service-account JSON is needed.
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
