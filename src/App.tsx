import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { signOut } from 'firebase/auth'
import { useAuth } from './context/AuthContext'
import { getFirebaseServices } from './lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
const AuthPage = lazy(() => import('./components/AuthPage'))
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
const TeacherProfile = lazy(() => import('./components/TeacherProfile'))
const AdminOverview = lazy(() => import('./components/AdminOverview'))
const AdminResources = lazy(() => import('./components/AdminResources'))
import { ArrowRight, ArrowUpRight, BookOpen, BookOpenCheck, Building2, Check, CheckCircle2, ClipboardList, FileText, Filter, GraduationCap, Library, LockKeyhole, Menu, Search, ShieldCheck, Sparkles, Users, X } from 'lucide-react'

type Resource = { id:string; title:string; subject:string; className:string; term:string; curriculum:string; state?:string; kind:string; price:number; description:string; topics:string[] }
const classOptions=['All classes','JSS1','JSS2','JSS3','SS1','SS2','SS3']
const subjectOptions=['All subjects','Mathematics','English Language','Basic Technology','Computer Studies','Biology','Chemistry','Physics','Civic Education']
const termOptions=['All terms','First Term','Second Term','Third Term']
function usePublishedResources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { db } = getFirebaseServices()
        const snapshot = await getDocs(collection(db, 'publicResources'))
        const rows = snapshot.docs.map((entry) => ({
          ...entry.data(),
          id: entry.id,
        } as Resource))
        rows.sort((a, b) => a.title.localeCompare(b.title))
        if (active) setResources(rows)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load published resources.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])
  return { resources, loading, error }
}
function Brand(){return <Link to="/" className="brand"><span className="brand-icon"><BookOpenCheck size={21}/></span><span>Lesson<span>Nest</span></span></Link>}
function Header(){const [menu,setMenu]=useState(false);return <header className="site-header"><div className="wrap nav"><Brand/><button className="mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation">{menu?<X/>:<Menu/>}</button><nav className={menu?'nav-links show':'nav-links'}><NavLink to="/resources" onClick={()=>setMenu(false)}>Resources</NavLink><NavLink to="/schools" onClick={()=>setMenu(false)}>For schools</NavLink><NavLink to="/pricing" onClick={()=>setMenu(false)}>Pricing</NavLink><NavLink to="/about" onClick={()=>setMenu(false)}>About</NavLink></nav><div className="nav-cta"><Link to="/login" className="login-link">Log in</Link><Link to="/register" className="button primary small">Get started <ArrowUpRight size={15}/></Link></div></div></header>}
function Footer(){return <footer className="footer"><div className="wrap footer-grid"><div><Brand/><p>Thoughtful teaching resources for the people shaping tomorrow.</p></div><div><b>Explore</b><Link to="/resources">Resource library</Link><Link to="/schools">For schools</Link><Link to="/pricing">Pricing</Link></div><div><b>LessonNest</b><Link to="/about">About</Link><a href="mailto:hello@lessonnest.com">Contact</a><Link to="/login">Sign in</Link></div><div className="footer-credit">Made for teachers. Built for better learning.<span>Created and developed by <strong>abdulsalamdevhub</strong>.</span></div></div><div className="wrap copyright">© {new Date().getFullYear()} LessonNest. All rights reserved.</div></footer>}
function Shell({children}:{children:ReactNode}){return <><Header/>{children}<Footer/></>}
function Card({r}:{r:Resource}){return <article className="resource-card"><div className="resource-art"><span className="art-icon"><BookOpen size={25}/></span><span className="class-chip">{r.className}</span></div><div className="resource-body"><div className="meta-line"><span>{r.subject}</span><span>{r.term}</span></div><h3><Link to={'/resources/'+r.id}>{r.title}</Link></h3><p>{r.description}</p><div className="card-bottom"><span><FileText size={14}/>{r.kind}</span><b>₦{r.price.toLocaleString('en-NG')}</b></div><Link className="inline-link" to={'/resources/'+r.id}>View resource <ArrowRight size={15}/></Link></div></article>}
function Home(){const [query,setQuery]=useState('');const nav=useNavigate();const {resources,loading,error}=usePublishedResources();return <Shell><main><section className="hero"><div className="wrap hero-grid"><div><span className="eyebrow-pill"><Sparkles size={14}/> A calmer way to prepare for class</span><h1>Teach with confidence.<br/><em>Prepare with ease.</em></h1><p className="hero-lead">Find organised schemes of work, detailed lesson notes and classroom assessments made for Nigerian secondary schools.</p><form className="search-box" onSubmit={e=>{e.preventDefault();nav('/resources?q='+encodeURIComponent(query))}}><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a subject, class or topic..."/><button className="button primary">Search</button></form><div className="hero-points"><span><CheckCircle2/> JSS1–SS3 resources</span><span><CheckCircle2/> Teacher-friendly formats</span></div></div><div className="hero-art"><div className="ring ring-a"/><div className="ring ring-b"/><div className="paper paper-back"><small>TERM OVERVIEW</small><h3>Your teaching plan</h3><i/><i/><div className="paper-row"><Check/> Scheme of work</div><div className="paper-row"><Check/> Lesson notes</div><div className="paper-row"><Check/> Class activities</div></div><div className="paper paper-front"><span className="paper-icon"><BookOpenCheck size={28}/></span><small>LESSONNEST LIBRARY</small><h3>Good teaching starts with good preparation.</h3><div className="progress"><span/></div><p>Organised. Practical. Ready to use.</p></div><div className="floating-note"><ClipboardList/><span><b>One term, organised</b><small>All your essentials in one place</small></span></div></div></div></section><section className="trust"><div className="wrap trust-row"><span>BUILT FOR THE CLASSROOM</span><b><GraduationCap/> Secondary education</b><b><BookOpen/> Practical resources</b><b><ShieldCheck/> Clear curriculum labels</b></div></section><section className="section"><div className="wrap"><div className="section-head"><div><span className="overline">THE RESOURCE LIBRARY</span><h2>Everything you need, <em>in one place.</em></h2><p>Spend less time gathering materials and more time helping students learn.</p></div><Link className="inline-link" to="/resources">Explore all resources <ArrowRight/></Link></div><div className="resource-grid">{loading?<p>Loading published resources…</p>:error?<p role="alert">{error}</p>:resources.slice(0,2).map(r=><Card key={r.id} r={r}/>)}</div></div></section><section className="section soft"><div className="wrap"><div className="section-head centered"><span className="overline">SIMPLE BY DESIGN</span><h2>From search to classroom, <em>made simple.</em></h2><p>A clear process that helps you find the right material without the runaround.</p></div><div className="steps">{[{n:'01',t:'Find your class',d:'Choose JSS or SS, then select the class and subject you teach.'},{n:'02',t:'Explore the term',d:'Compare schemes, notes and assessment resources before you buy.'},{n:'03',t:'Get prepared',d:'Create an account, complete payment and access your purchased files.'}].map(s=><div className="step" key={s.n}><span>{s.n}</span><h3>{s.t}</h3><p>{s.d}</p></div>)}</div></div></section><section className="section"><div className="wrap audience"><div><span className="overline">FOR THE PEOPLE WHO TEACH</span><h2>More time for <em>meaningful teaching.</em></h2><p>LessonNest brings the essentials of term preparation into one thoughtfully organised library, whether you teach one subject or coordinate a whole school.</p><ul><li><CheckCircle2/> Find resources by class, subject and term</li><li><CheckCircle2/> Preview details before making a purchase</li><li><CheckCircle2/> Keep purchased resources together</li></ul><Link className="button primary" to="/resources">Explore the library <ArrowRight/></Link></div><div className="audience-panel"><div className="audience-tile blue"><Users/><b>For teachers</b><span>Prepare each lesson with a little more confidence.</span></div><div className="audience-tile white"><Building2/><b>For school leaders</b><span>Bring resource planning together across your school.</span></div><h3>A more organised start to every term.</h3><small>THE LESSONNEST APPROACH</small></div></div></section><section className="cta"><div className="wrap cta-row"><div><span className="overline light">YOUR NEXT TERM STARTS HERE</span><h2>Make room for the teaching that matters.</h2><p>Explore the LessonNest resource library and find a better way to prepare.</p></div><Link className="button white" to="/resources">Browse resources <ArrowRight/></Link></div></section></main></Shell>}
function LibraryPage(){const loc=useLocation();const {resources,loading,error}=usePublishedResources();const [q,setQ]=useState(new URLSearchParams(loc.search).get('q')||'');const [cls,setCls]=useState('All classes'),[subject,setSubject]=useState('All subjects'),[term,setTerm]=useState('All terms'),[kind,setKind]=useState('All types');const filtered=useMemo(()=>resources.filter(r=>(!q||[r.title,r.subject,r.className,...r.topics].join(' ').toLowerCase().includes(q.toLowerCase()))&&(cls==='All classes'||r.className===cls)&&(subject==='All subjects'||r.subject===subject)&&(term==='All terms'||r.term===term)&&(kind==='All types'||r.kind===kind)),[q,cls,subject,term,kind]);const clear=()=>{setQ('');setCls('All classes');setSubject('All subjects');setTerm('All terms');setKind('All types')};return <Shell><main className="page"><div className="wrap"><div className="page-intro"><span className="overline">LESSONNEST LIBRARY</span><h1>Find the right resources <em>for your classroom.</em></h1><p>Browse teaching materials by class, subject and academic term. Preview each resource before you decide.</p></div><div className="library-layout"><aside className="filters"><div className="filter-head"><b><Filter/> Refine your search</b><button onClick={clear}>Clear</button></div><label>Search<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search resources..."/></label><label>Class<select value={cls} onChange={e=>setCls(e.target.value)}>{classOptions.map(x=><option key={x}>{x}</option>)}</select></label><label>Subject<select value={subject} onChange={e=>setSubject(e.target.value)}>{subjectOptions.map(x=><option key={x}>{x}</option>)}</select></label><label>Academic term<select value={term} onChange={e=>setTerm(e.target.value)}>{termOptions.map(x=><option key={x}>{x}</option>)}</select></label><label>Resource type<select value={kind} onChange={e=>setKind(e.target.value)}>{['All types','Complete term pack','Lesson notes','Assessment pack'].map(x=><option key={x}>{x}</option>)}</select></label><div className="filter-hint"><ShieldCheck/> Curriculum and state labels are shown on each resource. State-specific availability will expand as reviewed materials are added.</div></aside><div><div className="results-head"><span><b>{filtered.length}</b> published resources</span></div>{loading?<p>Loading published resources…</p>:error?<p role="alert">{error}</p>:filtered.length?<div className="resource-grid">{filtered.map(r=><Card key={r.id} r={r}/>)}</div>:<div className="empty"><Library size={34}/><h3>No matching resources yet</h3><p>Try another search or clear some filters. New resources will appear as they are published.</p><button className="button outline" onClick={clear}>Clear filters</button></div>}</div></div></div></main></Shell>}
function Detail(){const {id}=useParams();const {resources,loading,error}=usePublishedResources();const r=resources.find(x=>x.id===id);const nav=useNavigate();if(loading)return <Shell><div className="wrap page"><p>Loading resource…</p></div></Shell>;if(error)return <Shell><div className="wrap page"><p role="alert">{error}</p></div></Shell>;if(!r)return <Shell><div className="wrap page"><h1>Resource not found</h1><Link to="/resources" className="inline-link">Back to library <ArrowRight/></Link></div></Shell>;return <Shell><main className="page"><div className="wrap detail"><Link to="/resources" className="back">← Back to resources</Link><div className="detail-grid"><div><div className="detail-cover"><BookOpenCheck size={42}/><small>LESSONNEST RESOURCE</small><h2>{r.title}</h2><p>{r.className} · {r.term} · {r.subject}</p></div><section className="detail-section"><span className="overline">ABOUT THIS RESOURCE</span><h2>Prepare with a clearer plan.</h2><p>{r.description}</p><div className="notice"><Sparkles/><span>This resource has been published by the LessonNest administrator. Review its details before making a purchase.</span></div></section><section className="detail-section"><h3>Topics covered</h3>{r.topics.map(t=><div className="topic" key={t}><CheckCircle2/>{t}</div>)}</section></div><aside className="purchase"><span className="demo-tag">RESOURCE DETAILS</span><h3>Resource overview</h3>{[['Class',r.className],['Subject',r.subject],['Term',r.term],['Curriculum',r.curriculum+(r.state?' · '+r.state:'')],['Format','PDF (planned)']].map(([a,b])=><div className="overview" key={a}><span>{a}</span><b>{b}</b></div>)}<div className="price"><span>Price</span><strong>₦{r.price.toLocaleString('en-NG')}</strong></div><button className="button primary full" onClick={()=>nav('/register?next='+encodeURIComponent('/resources/'+r.id))}>Register to purchase <ArrowRight/></button><small className="secure"><LockKeyhole/> Secure purchasing and downloads will be enabled in a later stage.</small></aside></div></div></main></Shell>}
function Pricing(){return <Shell><main className="page"><div className="wrap narrow"><div className="page-intro centered"><span className="overline">SIMPLE, TRANSPARENT PRICING</span><h1>Resources that respect <em>your budget.</em></h1><p>Start with the materials you need. School purchasing options will support larger resource needs.</p></div><div className="pricing-grid"><div className="price-card"><span className="overline">INDIVIDUAL</span><h2>Pay per resource</h2><p>Choose a subject and term pack that fits your classroom needs.</p><div className="price-range">From <b>₦1,200</b></div><ul><li><Check/> Browse resource previews</li><li><Check/> Purchase selected resources</li><li><Check/> Personal library (planned)</li></ul><Link className="button primary full" to="/resources">Browse resources</Link></div><div className="price-card featured"><span className="overline">SCHOOL ACCESS</span><h2>Plan for your school</h2><p>Discuss a resource package for multiple classes and subjects.</p><div className="price-range"><b>Let's talk</b></div><ul><li><Check/> Multi-subject resource planning</li><li><Check/> School access options</li><li><Check/> Coordinated purchasing (planned)</li></ul><Link className="button dark full" to="/schools">Explore school options</Link></div></div><p className="disclaimer">Prices shown are illustrative examples for the demo catalogue, not live offers. Final prices will be set by the administrator.</p></div></main></Shell>}
function Schools(){return <Shell><main className="page"><div className="wrap split"><div><span className="overline">FOR SCHOOL MANAGEMENT</span><h1>Bring teaching preparation <em>together.</em></h1><p className="lead">Give teachers and academic coordinators a clearer way to find the resources they need across classes and subjects.</p><ul><li><CheckCircle2/> Browse materials across JSS and SS classes</li><li><CheckCircle2/> Plan resource needs by subject and term</li><li><CheckCircle2/> Explore coordinated school purchasing</li></ul><a className="button primary" href="mailto:schools@lessonnest.com?subject=LessonNest%20school%20enquiry">Make a school enquiry <ArrowUpRight/></a></div><div className="school-card"><Building2 size={42}/><h2>A shared starting point for better preparation.</h2><p>School accounts, member access and bulk purchasing will be activated after secure account and payment integration.</p><span className="demo-tag">SCHOOL PORTAL — COMING SOON</span></div></div></main></Shell>}
function About(){return <Shell><main className="page"><div className="wrap narrow"><div className="page-intro"><span className="overline">ABOUT LESSONNEST</span><h1>Made for the people <em>who make learning happen.</em></h1><p>LessonNest is being built to make quality teaching resources easier to discover and use across Nigerian secondary schools.</p></div><div className="about-card"><GraduationCap size={32}/><h2>Our purpose</h2><p>Teachers do important work. Finding schemes of work, preparing detailed notes and creating assessments should not have to start from scratch every term. LessonNest brings these resources into one clear, organised place.</p><div>Created and developed by <b>abdulsalamdevhub</b>.</div></div></div></main></Shell>}
function LoadingPanel({ label = 'Loading…' }: { label?: string }) {
  return <div className="wrap page" role="status" aria-live="polite"><p>{label}</p></div>
}

function Workspace({role}:{role:'teacher'|'admin'}) {
  const title = role === 'admin' ? 'Admin workspace' : 'Your teaching library'
  const { user } = useAuth()
  const navigate = useNavigate()
  const [teacherName, setTeacherName] = useState(user?.displayName || '')
  const [signOutError, setSignOutError] = useState('')

  const handleSignOut = async () => {
    setSignOutError('')
    try {
      const { auth } = getFirebaseServices()
      await signOut(auth)
      navigate('/login', { replace: true })
    } catch {
      setSignOutError('We could not sign you out. Please try again.')
    }
  }

  return (
    <Shell>
      <main className="page">
        <div className="wrap workspace">
          <span className="overline">LESSONNEST WORKSPACE</span>
          <h1>{title}</h1>
          {role === 'admin' && (
            <>
              <section className="dashboard-account">
                <div className="dashboard-avatar">A</div>
                <div className="dashboard-identity">
                  <span>ADMINISTRATOR</span>
                  <strong>{user?.displayName || 'LessonNest Admin'}</strong>
                  <small>{user?.email}</small>
                </div>
                <button className="button outline dashboard-signout" onClick={handleSignOut}>Sign out</button>
              </section>
              <Suspense fallback={<LoadingPanel label="Loading admin dashboard…" />}>
                <AdminOverview />
                <AdminResources />
              </Suspense>
            </>
          )}
          {role === 'teacher' && (
            <>
              <section className="dashboard-account">
                <div className="dashboard-avatar">{(teacherName || user?.email || 'T').charAt(0).toUpperCase()}</div>
                <div className="dashboard-identity">
                  <span>SIGNED IN AS</span>
                  <strong>{teacherName || 'Teacher'}</strong>
                  <small>{user?.email}</small>
                </div>
                <button className="button outline dashboard-signout" onClick={handleSignOut}>Sign out</button>
              </section>
              <Suspense fallback={<LoadingPanel label="Loading your profile…" />}>
                <TeacherProfile onNameSaved={setTeacherName}/>
              </Suspense>
            </>
          )}
          {signOutError && <p className="auth-feedback error" role="alert">{signOutError}</p>}
          {role === 'teacher' && (
            <>
              <p>Your account is connected. Purchased resources and activity will appear here as those features are added.</p>
              <div className="notice"><ShieldCheck/><span>Your sign-in is protected. Resource purchases and live account activity are still being developed.</span></div>
              <div className="workspace-grid">
            <div><BookOpen/><b>My resources</b><span>Purchased files will appear here.</span></div>
            <div><FileText/><b>Activity</b><span>Your verified account activity.</span></div>
            <div><Users/><b>Account</b><span>Manage your profile and preferences.</span></div>
              </div>
            </>
          )}
        </div>
      </main>
    </Shell>
  )
}
function NotFound(){return <Shell><div className="wrap not-found"><span className="overline">404 · PAGE NOT FOUND</span><h1>This page seems to have wandered off.</h1><p>Let's get you back to the resources and tools you came for.</p><Link className="button primary" to="/">Return home <ArrowRight/></Link></div></Shell>}
export default function App(){return <Routes><Route path="/" element={<Home/>}/><Route path="/resources" element={<LibraryPage/>}/><Route path="/resources/:id" element={<Detail/>}/><Route path="/pricing" element={<Pricing/>}/><Route path="/schools" element={<Schools/>}/><Route path="/about" element={<About/>}/><Route path="/login" element={<Suspense fallback={<LoadingPanel label="Loading sign in…" />}><AuthPage/></Suspense>}/><Route path="/register" element={<Suspense fallback={<LoadingPanel label="Loading registration…" />}><AuthPage/></Suspense>}/><Route path="/dashboard" element={<ProtectedRoute><Workspace role="teacher"/></ProtectedRoute>}/><Route path="/school" element={<Navigate to="/schools" replace/>}/><Route path="/admin" element={<AdminRoute><Workspace role="admin"/></AdminRoute>}/><Route path="*" element={<NotFound/>}/></Routes>}