'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './tasks.module.css'

const STORE = 'adhd_todos_v4'

function calcPriority(deadline, hours, type) {
  const hoursLeft = Math.max((new Date(deadline).getTime() - Date.now()) / 3600000, 0.01)
  const urgency = Math.min(100, (parseFloat(hours) / hoursLeft) * 100)
  const effort = Math.min(30, parseFloat(hours) * 3)
  const creative = type === 'creative' ? 15 : 0
  const score = Math.min(100, Math.round(urgency * 0.6 + effort * 0.3 + creative))
  const level = score >= 40 ? 'high' : score >= 15 ? 'med' : 'low'
  return { score, level }
}

function hoursUntil(dl) {
  const h = (new Date(dl).getTime() - Date.now()) / 3600000
  if (h < 0) return '⚠️ overdue'
  if (h < 1) return Math.round(h * 60) + 'm left'
  if (h < 24) return h.toFixed(1) + 'h left'
  return Math.round(h / 24) + 'd left'
}

function toLocalDT(iso) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function TasksInner() {
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const [todos, setTodos] = useState([])
  const [editingId, setEditingId] = useState(editId || null)
  const [editData, setEditData] = useState({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try { const r = localStorage.getItem(STORE); if (r) setTodos(JSON.parse(r)) } catch (e) {}
    setMounted(true)
  }, [])

  useEffect(() => {
    if (editId && todos.length) {
      const t = todos.find(t => t.id === editId)
      if (t) startEdit(t)
    }
  }, [editId, todos.length])

  function save(next) {
    setTodos(next)
    try { localStorage.setItem(STORE, JSON.stringify(next)) } catch (e) {}
  }

  function startEdit(t) {
    setEditingId(t.id)
    setEditData({ text: t.text, desc: t.desc || '', deadline: toLocalDT(t.deadline), hours: t.hours, type: t.type })
  }

  function saveEdit(id) {
    const { score, level } = calcPriority(editData.deadline, editData.hours, editData.type)
    save(todos.map(t => t.id === id ? { ...t, ...editData, hours: parseFloat(editData.hours), score, level } : t))
    setEditingId(null)
  }

  function del(id) { save(todos.filter(t => t.id !== id)) }
  function toggle(id) { save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t)) }

  const scored = todos.map(t => ({ ...t, ...calcPriority(t.deadline, t.hours, t.type) }))
  const active = scored.filter(t => !t.done).sort((a, b) => b.score - a.score)
  const done = scored.filter(t => t.done)
  const priDot = { high: styles.priHigh, med: styles.priMed, low: styles.priLow }

  if (!mounted) return null

  const renderItem = (t) => {
    if (editingId === t.id) {
      return (
        <div key={t.id} className={styles.editCard}>
          <input value={editData.text} onChange={e => setEditData({ ...editData, text: e.target.value })} className={styles.editInput} placeholder="task name" />
          <textarea value={editData.desc} onChange={e => setEditData({ ...editData, desc: e.target.value })} className={styles.editDesc} placeholder="description (optional)" rows={2} />
          <div className={styles.editRow}>
            <div className={styles.field}>
              <label>deadline</label>
              <input type="datetime-local" value={editData.deadline} onChange={e => setEditData({ ...editData, deadline: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>hours</label>
              <input type="number" value={editData.hours} onChange={e => setEditData({ ...editData, hours: e.target.value })} min="0.5" step="0.5" style={{ width: 70 }} />
            </div>
            <div className={styles.field}>
              <label>type</label>
              <select value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })}>
                <option value="regular">regular</option>
                <option value="creative">✦ creative</option>
              </select>
            </div>
          </div>
          <div className={styles.editActions}>
            <button onClick={() => saveEdit(t.id)} className={styles.saveBtn}>save</button>
            <button onClick={() => setEditingId(null)} className={styles.cancelBtn}>cancel</button>
          </div>
        </div>
      )
    }

    return (
      <div key={t.id} className={`${styles.item} ${t.done ? styles.itemDone : ''}`}>
        <button className={`${styles.cb} ${t.done ? styles.cbChecked : ''}`} onClick={() => toggle(t.id)}>{t.done ? '✓' : ''}</button>
        <span className={`${styles.priDot} ${priDot[t.level]}`} />
        <div className={styles.taskBody}>
          <span className={`${styles.taskText} ${t.done ? styles.taskDone : ''}`}>{t.text}{t.type === 'creative' && <span className={styles.creativeTag}>creative</span>}</span>
          <span className={styles.taskMeta}>{t.score}% priority · {hoursUntil(t.deadline)} · {t.hours}h</span>
          {t.desc && <span className={styles.taskDesc}>{t.desc}</span>}
        </div>
        <button className={styles.editBtn} onClick={() => startEdit(t)}>✎</button>
        <button className={styles.delBtn} onClick={() => del(t.id)}>✕</button>
      </div>
    )
  }

  return (
    <div>
      <h1 className={styles.title}>your tasks</h1>
      <p className={styles.sub}>{todos.length} total · {todos.filter(t => t.done).length} done</p>

      {!todos.length ? (
        <div className={styles.empty}>no tasks yet — <a href="/">add some</a></div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <p className={styles.sectionHd}>to do · sorted by priority</p>
              {active.map(renderItem)}
            </>
          )}
          {done.length > 0 && (
            <>
              <p className={styles.sectionHd}>completed ✓</p>
              {done.map(renderItem)}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function TasksPage() {
  return <Suspense><TasksInner /></Suspense>
}