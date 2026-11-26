import { getFirebaseAdminAuth } from '../server/firebaseAdmin'

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  }

  try {
    getFirebaseAdminAuth()
    return res.status(200).json({
      ok: true,
      service: 'LessonNest API',
      firebaseAdmin: 'configured',
    })
  } catch {
    return res.status(500).json({
      ok: false,
      service: 'LessonNest API',
      error: 'Firebase server credentials are not configured correctly.',
    })
  }
}
