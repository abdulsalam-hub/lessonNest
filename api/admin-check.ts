import { getFirebaseAdminAuth } from '../server/firebaseAdmin.js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed.',
    })
  }

  const authorization = req.headers?.authorization
  const match =
    typeof authorization === 'string'
      ? authorization.match(/^Bearer\s+(.+)$/i)
      : null

  if (!match?.[1]) {
    return res.status(401).json({
      ok: false,
      error: 'A valid Firebase ID token is required.',
    })
  }

  let adminAuth

  try {
    adminAuth = getFirebaseAdminAuth()
  } catch {
    return res.status(500).json({
      ok: false,
      error: 'Server authentication is not configured correctly.',
    })
  }

  let decodedToken

  try {
    decodedToken = await adminAuth.verifyIdToken(match[1], true)
  } catch {
    return res.status(401).json({
      ok: false,
      error: 'The Firebase ID token is invalid, expired, or revoked.',
    })
  }

  if (decodedToken.admin !== true) {
    return res.status(403).json({
      ok: false,
      error: 'Administrator access is required.',
    })
  }

  return res.status(200).json({
    ok: true,
    admin: true,
    uid: decodedToken.uid,
  })
}
