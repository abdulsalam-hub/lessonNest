import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore'
import { getFirebaseServices } from '../lib/firebase'
import { Plus, Save, UploadCloud, RefreshCw, Pencil, Eye, EyeOff, FileText } from 'lucide-react'

type ResourceStatus = 'draft' | 'published' | 'unpublished'
type ResourceRecord = {
  id: string
  title: string
  subject: string
  className: string
  term: string
  curriculum: string
  state: string
  kind: string
  price: number
  description: string
  topics: string[]
  status: ResourceStatus
  fileUrl?: string
  fileName?: string
  createdAt?: { toMillis?: () => number } | null
}

type FormState = {
  title: string
  subject: string
  className: string
  term: string
  curriculum: string
  state: string
  kind: string
  price: string
  description: string
  topics: string
}

const emptyForm: FormState = {
  title: '', subject: '', className: 'JSS1', term: 'First Term',
  curriculum: 'Nigerian National', state: '', kind: 'Lesson notes',
  price: '0', description: '', topics: '',
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim()
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim()

export default function AdminResources() {
  const [items, setItems] = useState<ResourceRecord[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const syncPublicResource = async (db: ReturnType<typeof getFirebaseServices>['db'], item: ResourceRecord) => {
    const publicRef = doc(db, 'publicResources', item.id)
    if (item.status !== 'published') {
      await deleteDoc(publicRef)
      return
    }
    // Deliberately publish catalogue metadata only. Never copy fileUrl or fileName.
    await setDoc(publicRef, {
      title: item.title,
      subject: item.subject,
      className: item.className,
      term: item.term,
      curriculum: item.curriculum,
      state: item.state || '',
      kind: item.kind,
      price: item.price,
      description: item.description,
      topics: item.topics || [],
      updatedAt: serverTimestamp(),
    })
  }

  const loadResources = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { db } = getFirebaseServices()
      const snapshot = await getDocs(collection(db, 'resources'))
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...entry.data(),
      } as ResourceRecord))
      rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      await Promise.all(rows.filter((row) => row.status === 'published').map((row) => syncPublicResource(db, row)))
      setItems(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load resources.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadResources() }, [loadResources])

  const resetForm = () => {
    setForm(emptyForm)
    setFile(null)
    setEditingId(null)
  }

  const uploadFile = async (selectedFile: File) => {
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary is not configured yet. Add the two LessonNest Cloudinary environment variables in Vercel.')
    }
    const body = new FormData()
    body.append('file', selectedFile)
    body.append('upload_preset', uploadPreset)
    body.append('folder', 'lessonnest/resources')
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
      method: 'POST',
      body,
    })
    const result = await response.json() as { secure_url?: string; original_filename?: string; error?: { message?: string } }
    if (!response.ok || !result.secure_url) {
      throw new Error(result.error?.message || 'Cloudinary could not upload this file.')
    }
    return { fileUrl: result.secure_url, fileName: selectedFile.name }
  }

  const saveResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!editingId && !file) {
      setError('Choose a PDF or document to upload.')
      return
    }
    if (!editingId && (!cloudName || !uploadPreset)) {
      setError('Cloudinary is not configured yet. Add the LessonNest Cloudinary settings in Vercel first.')
      return
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setError('Please choose a file smaller than 10 MB.')
      return
    }
    const price = Number(form.price)
    if (!Number.isFinite(price) || price < 0) {
      setError('Enter a valid price of zero or more.')
      return
    }

    setSaving(true)
    try {
      const { db } = getFirebaseServices()
      const uploaded: { fileUrl?: string; fileName?: string } = file ? await uploadFile(file) : {}
      const data = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        className: form.className,
        term: form.term,
        curriculum: form.curriculum,
        state: form.state.trim(),
        kind: form.kind,
        price,
        description: form.description.trim(),
        topics: form.topics.split(',').map((topic) => topic.trim()).filter(Boolean),
        ...(uploaded.fileUrl ? uploaded : {}),
        updatedAt: serverTimestamp(),
      }
      if (editingId) {
        await updateDoc(doc(db, 'resources', editingId), data)
        const updatedItem = { ...items.find((item) => item.id === editingId)!, ...data } as ResourceRecord
        if (updatedItem.status === 'published') await syncPublicResource(db, updatedItem)
        setMessage('Resource details updated.')
      } else {
        await addDoc(collection(db, 'resources'), {
          ...data,
          status: 'draft',
          createdAt: serverTimestamp(),
        })
        setMessage('Resource uploaded and saved as a draft. Review it before publishing.')
      }
      resetForm()
      await loadResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this resource.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (item: ResourceRecord) => {
    setEditingId(item.id)
    setFile(null)
    setForm({
      title: item.title || '',
      subject: item.subject || '',
      className: item.className || 'JSS1',
      term: item.term || 'First Term',
      curriculum: item.curriculum || 'Nigerian National',
      state: item.state || '',
      kind: item.kind || 'Lesson notes',
      price: String(item.price ?? 0),
      description: item.description || '',
      topics: (item.topics || []).join(', '),
    })
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changeStatus = async (item: ResourceRecord, status: ResourceStatus) => {
    setError('')
    setMessage('')
    try {
      const { db } = getFirebaseServices()
      await updateDoc(doc(db, 'resources', item.id), {
        status,
        updatedAt: serverTimestamp(),
      })
      await syncPublicResource(db, { ...item, status })
      setMessage(`“${item.title}” is now ${status}.`)
      await loadResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update resource status.')
    }
  }

  return (
    <section className="admin-resources" aria-label="Resource management">
      <div className="admin-section-heading">
        <div>
          <span className="overline">CONTENT MANAGEMENT</span>
          <h2>Resource management</h2>
          <p>Upload teaching materials, review details and control what appears in the public library.</p>
        </div>
        <button className="button outline admin-refresh" type="button" onClick={() => void loadResources()} disabled={loading}>
          <RefreshCw size={15}/> Refresh
        </button>
      </div>

      {error && <p className="auth-feedback error" role="alert">{error}</p>}
      {message && <p className="auth-feedback success" role="status">{message}</p>}

      <form className="admin-resource-form" onSubmit={saveResource}>
        <div className="admin-form-title">
          <h3>{editingId ? 'Edit resource' : 'Upload a teaching resource'}</h3>
          {editingId && <button type="button" className="text-button" onClick={resetForm}>Cancel edit</button>}
        </div>
        <div className="admin-form-grid">
          <label>Resource title<input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. SS1 Mathematics — First Term"/></label>
          <label>Subject<input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics"/></label>
          <label>Class<select value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })}>{['JSS1','JSS2','JSS3','SS1','SS2','SS3'].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label>Term<select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>{['First Term','Second Term','Third Term'].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label>Curriculum<select value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })}><option>Nigerian National</option><option>State-specific scheme</option></select></label>
          <label>State (if applicable)<input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Lagos"/></label>
          <label>Resource type<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{['Scheme of work','Lesson notes','Classwork / Assignment','Test / Examination','Complete term pack'].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label>Price (₦)<input required type="number" min="0" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/></label>
          <label className="admin-form-wide">Description<textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what teachers will receive."/></label>
          <label className="admin-form-wide">Topics (separate with commas)<input value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} placeholder="Number bases, Indices, Logarithms"/></label>
          <label className="admin-form-wide admin-file-field">
            <span>{editingId ? 'Replace file (optional)' : 'Teaching material file (PDF, DOC, DOCX, PPT, PPTX)'}</span>
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" required={!editingId} onChange={(e) => setFile(e.target.files?.[0] || null)}/>
            <small>{file ? file.name : 'Maximum file size: 10 MB.'}</small>
          </label>
        </div>
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? 'Saving resource…' : <><UploadCloud size={16}/> {editingId ? 'Save changes' : 'Upload resource as draft'}</>}
        </button>
      </form>

      <div className="admin-resource-list-heading">
        <h3>All teaching resources <span>{items.length}</span></h3>
        <small>New uploads start as drafts and are not visible to teachers until published.</small>
      </div>
      {loading ? <p className="admin-list-state">Loading resources…</p> : items.length === 0 ? (
        <div className="admin-list-state"><FileText size={24}/><b>No resources uploaded yet</b><span>Your first teaching material will appear here.</span></div>
      ) : (
        <div className="admin-resource-list">
          {items.map((item) => (
            <article className="admin-resource-row" key={item.id}>
              <div className="admin-resource-main">
                <span className={`admin-resource-status status-${item.status || 'draft'}`}>{item.status || 'draft'}</span>
                <h4>{item.title}</h4>
                <p>{item.className} · {item.subject} · {item.term} · ₦{Number(item.price || 0).toLocaleString('en-NG')}</p>
                {item.fileName && <small>{item.fileName}</small>}
              </div>
              <div className="admin-resource-actions">
                <button type="button" className="button outline small" onClick={() => startEdit(item)}><Pencil size={14}/> Edit</button>
                {item.status === 'published' ? (
                  <button type="button" className="button outline small" onClick={() => void changeStatus(item, 'unpublished')}><EyeOff size={14}/> Unpublish</button>
                ) : (
                  <button type="button" className="button primary small" onClick={() => void changeStatus(item, 'published')}><Eye size={14}/> Publish</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
