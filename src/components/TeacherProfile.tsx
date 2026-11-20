import { useState, type FormEvent } from 'react'
import { sendEmailVerification, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { CheckCircle2, Mail, Save, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getFirebaseServices } from '../lib/firebase'

type Props = { onNameSaved: (name: string) => void }

export default function TeacherProfile({ onNameSaved }: Props) {
  const { user } = useAuth()
  const [name, setName] = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    const cleanName = name.trim()
    if (!user) {
      setError('Please sign in again before updating your profile.')
      return
    }
    if (cleanName.length < 2) {
      setError('Please enter a name with at least 2 characters.')
      return
    }
    if (cleanName === (user.displayName || '')) {
      setMessage('Your profile is already up to date.')
      return
    }

    setSaving(true)
    const previousName = user.displayName || ''
    try {
      const { db } = getFirebaseServices()
      await updateProfile(user, { displayName: cleanName })
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: cleanName,
          updatedAt: serverTimestamp(),
        })
      } catch (writeError) {
        await updateProfile(user, { displayName: previousName }).catch(() => undefined)
        throw writeError
      }
      onNameSaved(cleanName)
      setMessage('Your profile has been updated successfully.')
    } catch {
      setError('We could not save your profile. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function resendVerification() {
    setMessage('')
    setError('')
    if (!user) return
    setSending(true)
    try {
      await sendEmailVerification(user)
      setMessage('A new verification email has been sent. Check your inbox and spam folder.')
    } catch (sendError) {
      const code = (sendError as { code?: string })?.code
      setError(code === 'auth/too-many-requests'
        ? 'A verification email was sent recently. Please wait before trying again.'
        : 'We could not send the verification email. Please try again later.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="teacher-profile">
      <div className="teacher-profile-heading">
        <div>
          <span className="overline">ACCOUNT SETTINGS</span>
          <h2>Teacher profile</h2>
          <p>Keep your account information accurate and up to date.</p>
        </div>
        <span className="teacher-profile-icon"><ShieldCheck size={20}/></span>
      </div>

      <form onSubmit={saveProfile} className="teacher-profile-form">
        <label htmlFor="teacher-display-name">Display name</label>
        <div className="teacher-profile-edit">
          <input
            id="teacher-display-name"
            value={name}
            onChange={event => setName(event.target.value)}
            autoComplete="name"
            maxLength={80}
            required
          />
          <button className="button primary" type="submit" disabled={saving}>
            <Save size={15}/>{saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
        <div className="teacher-profile-field">
          <span>Email address</span>
          <strong>{user?.email || 'Not available'}</strong>
          <small>Your sign-in email cannot be changed from this page.</small>
        </div>
      </form>

      <div className="teacher-verification">
        <div className="teacher-verification-copy">
          {user?.emailVerified ? <CheckCircle2 size={18}/> : <Mail size={18}/>}
          <div>
            <strong>{user?.emailVerified ? 'Email verified' : 'Email not verified yet'}</strong>
            <small>{user?.emailVerified
              ? 'Your email address has been verified.'
              : 'Verify your email to help protect your account.'}</small>
          </div>
        </div>
        {!user?.emailVerified && (
          <button type="button" className="button outline" onClick={resendVerification} disabled={sending}>
            {sending ? 'Sending…' : 'Resend email'}
          </button>
        )}
      </div>

      {error && <p className="auth-feedback error" role="alert">{error}</p>}
      {message && <p className="auth-feedback success" role="status">{message}</p>}
    </section>
  )
}
