import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, getIdTokenResult, sendEmailVerification, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ArrowRight, BookOpenCheck, LockKeyhole } from 'lucide-react'
import { getFirebaseServices } from '../lib/firebase'

function readableError(error: unknown) {
  const code = (error as { code?: string })?.code
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account already exists with this email. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a little and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase Authentication yet.',
    'auth/unauthorized-domain': 'This website domain is not authorised in Firebase Authentication. Add the exact domain shown in your browser address bar under Authentication > Settings > Authorised domains.',
    'auth/app-not-authorized': 'This Firebase app is not authorised to use Authentication. Check the Firebase project and web app configuration.',
  }
  if (code && messages[code]) return messages[code]
  const detail = error instanceof Error ? error.message : String(error)
  return code ? `Firebase error (${code}): ${detail}` : `Request failed: ${detail}`
}

export default function AuthPage() {
  const register = useLocation().pathname === '/register'
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (register && name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }
    if (password.length < 8) {
      setError('Your password must contain at least 8 characters.')
      return
    }

    setBusy(true)
    try {
      const { auth, db } = getFirebaseServices()
      if (register) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(credential.user, { displayName: name.trim() })
        await setDoc(doc(db, 'users', credential.user.uid), {
          uid: credential.user.uid,
          displayName: name.trim(),
          email: credential.user.email,
          role: 'teacher',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        await sendEmailVerification(credential.user)
        setNotice('Your account has been created. Please check your email for a verification link before signing in.')
        await auth.signOut()
        setPassword('')
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
        // Refresh the token so recently assigned Firebase custom claims are recognised.
        const token = await getIdTokenResult(credential.user, true)
        const isAdmin = token.claims.admin === true
        const next = new URLSearchParams(window.location.search).get('next')
        const destination = next && next.startsWith('/')
          ? next
          : isAdmin
            ? '/admin'
            : '/dashboard'
        navigate(destination, { replace: true })
        return
      }
    } catch (err) {
      setError(readableError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand auth-brand"><span className="brand-icon"><BookOpenCheck size={21}/></span><span>Lesson<span>Nest</span></span></Link>
        <span className="overline">{register ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</span>
        <h1>{register ? 'Join LessonNest' : 'Sign in to LessonNest'}</h1>
        <p>{register ? 'Create your teacher account to access your teaching resources.' : 'Access your LessonNest account and resource library.'}</p>
        <form onSubmit={submit}>
          {register && <label>Full name<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Your full name" required /></label>}
          <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@school.com" required /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={register ? 'new-password' : 'current-password'} placeholder="At least 8 characters" minLength={8} required /></label>
          {error && <p role="alert" className="auth-feedback error">{error}</p>}
          {notice && <p role="status" className="auth-feedback success">{notice}</p>}
          <button className="button primary full" type="submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={16}/></button>
        </form>
        <div className="auth-security"><LockKeyhole size={14}/> Your password is handled securely by Firebase Authentication.</div>
        <p className="auth-switch">{register ? 'Already have an account?' : 'New to LessonNest?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
        <Link className="auth-home" to="/">Return to LessonNest</Link>
      </div>
    </main>
  )
}
