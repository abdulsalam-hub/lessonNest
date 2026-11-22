import { useEffect, useState } from 'react'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { getFirebaseServices } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Clock3, Users, RefreshCw, ShieldCheck } from 'lucide-react'

type Counts = { users: number | null; resources: number | null; pending: number | null }

export default function AdminOverview() {
  const { user } = useAuth()
  const [counts, setCounts] = useState<Counts>({ users: null, resources: null, pending: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const { db } = getFirebaseServices()
      const [usersResult, resourcesResult, pendingResult] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'resources')),
        getCountFromServer(query(collection(db, 'resources'), where('status', '==', 'pending'))),
      ])
      setCounts({
        users: usersResult.data().count,
        resources: resourcesResult.data().count,
        pending: pendingResult.data().count,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not load the overview statistics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadStats() }, [])

  const cards = [
    { label: 'Registered teachers', value: counts.users, icon: Users, note: 'Teacher accounts on LessonNest' },
    { label: 'Total resources', value: counts.resources, icon: BookOpen, note: 'All resource records' },
    { label: 'Pending review', value: counts.pending, icon: Clock3, note: 'Resources awaiting approval' },
  ]

  return (
    <section className="admin-overview" aria-label="Administrator overview">
      <div className="admin-overview-head">
        <div>
          <span className="overline">PLATFORM SUMMARY</span>
          <h2>Welcome, {user?.displayName || 'Administrator'}</h2>
          <p>Here is the current snapshot of your LessonNest platform.</p>
        </div>
        <button className="button outline admin-refresh" onClick={() => void loadStats()} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'admin-spin' : ''}/> Refresh
        </button>
      </div>

      {error && <div className="auth-feedback error" role="alert">{error}<br/>Check your Firestore rules and try refreshing.</div>}

      <div className="admin-stat-grid">
        {cards.map(({ label, value, icon: Icon, note }) => (
          <article className="admin-stat-card" key={label}>
            <span className="admin-stat-icon"><Icon size={19}/></span>
            <span className="admin-stat-label">{label}</span>
            <strong>{loading ? '—' : value === null ? 'Unavailable' : value.toLocaleString('en-NG')}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>

      <div className="admin-overview-note">
        <ShieldCheck size={19}/>
        <div><b>Administrator access is active</b><span>Signed in as {user?.email}. These figures are read from Firestore and refresh when you request an update.</span></div>
      </div>
      <p className="admin-data-note">Payment totals and purchase activity are intentionally not shown yet; those will be added after the payment records and verification workflow are implemented.</p>
    </section>
  )
}
