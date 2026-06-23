'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './tasks.module.css'

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
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(editId || null)
  const [editData, setEditData] = useState({})

  useEffect(() => { fetchTasks() }, [])
  useEffect(() => {
    if (editId && tasks.length) {
      const t = tasks.find(t => t.id === editId)
      if (t) startEdit(t)
    }
  }, [editId, tasks.length])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').eq('done', false).order('score', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  function startEdit(t) {
    setEditingId(t.id)
    setEditData({ text: t.text, description: t.description || '', deadline: toLocalDT(t.deadline), hours: t.hours, type: t.type })
  }

  async function saveEdit(id) {
    const { score, level } = calcPriority(editData.deadline, editData.hours, editData.type)
    await supabase.from('tasks').update({
      text: editData.text,
      description: editData.description,
      deadline: new Date(editData.deadline).toISOString(),
      hours: parseFloat(editData.hours),
      type: editData.type,
      score, level
    }).eq('id', id)
    setEditingId(null)
    fetchTasks()
  }

  async function markDone(id) {
    await supabase.from('tasks').update({ done: true }).eq('id', id)
    fetchTasks()
  }

  async function del(id) {
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  const scored = tasks.map(t => ({ ...t, ...calcPriority(t.deadline, t.hours, t.type) }))
  const priDot = { high: styles.priHigh, med: styles.priMed, low: styles.priLow }
  const priLabel = { high: '🔴', med: '🟡', low: '🟢' }

  if (loading) return <div className={styles.loading}>loading...</div>

  return (
    <div>
      <h1 className={styles.title}>active tasks</h1>
      <p className={styles.sub}>{tasks.length} pending · sorted by priority</p>

      {!tasks.length ? (
        <div className={styles.empty}>all clear! <a href="/">add something</a></div>
      ) : (
        scored.map(t => {
          if (editingId === t.id) return (
            <div key={t.id} className={styles.editCard}>
              <input value={editData.text} onChange={e => setEditData({ ...editData, text: e.target.value })} className={styles.editInput} />
              <textarea value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} className={styles.editDesc} placeholder="description" rows={2} />
              <div className={styles.editRow}>
                <div className={styles.field}><label>deadline</label><input type="datetime-local" value={editData.deadline} onChange={e => setEditData({ ...editData, deadline: e.target.value })} /></div>
                <div className={styles.field}><label>hours</label><input type="number" value={editData.hours} onChange={e => setEditData({ ...editData, hours: e.target.value })} min="0.1" step="0.1" style={{ width: 70 }} /></div>
                <div className={styles.field}><label>type</label>
                  <select value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })}>
                    <option value="regular">regular</option>
                    <option value="creative">✦ creative</option>
                  </select>
                </div>
              </div>
              <div className={styles.editActions}>
                <button onClick={() => saveEdit(t.id)} className={styles.saveBtn}>save</button>
                <button onClick={() => setEditingId(null)}>cancel</button>
              </div>
            </div>
          )

          return (
            <div key={t.id} className={styles.item}>
              <button className={styles.cb} onClick={() => markDone(t.id)} title="mark done" />
              <span className={`${styles.priDot} ${priDot[t.level]}`} />
              <div className={styles.taskBody}>
                <span className={styles.taskText}>{t.text}{t.type === 'creative' && <span className={styles.creativeTag}>creative</span>}</span>
                <span className={styles.taskMeta}>{priLabel[t.level]} {t.score}% · {hoursUntil(t.deadline)} · {t.hours}h</span>
              </div>
              <button className={styles.editBtn} onClick={() => startEdit(t)} title="edit">✎</button>
              <button className={styles.delBtn} onClick={() => del(t.id)} title="delete">✕</button>
            </div>
          )
        })
      )}
    </div>
  )
}

export default function TasksPage() {
  return <Suspense><TasksInner /></Suspense>
}