'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import styles from './page.module.css'

const OLD_STORE = 'adhd_todos_v4'

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

function calcPriority(deadline, hours, type) {
  const hoursLeft = Math.max((new Date(deadline).getTime() - Date.now()) / 3600000, 0.01)
  const urgency = Math.min(100, (parseFloat(hours) / hoursLeft) * 100)
  const effort = Math.min(30, parseFloat(hours) * 3)
  const creative = type === 'creative' ? 15 : 0
  const score = Math.min(100, Math.round(urgency * 0.6 + effort * 0.3 + creative))
  const level = score >= 40 ? 'high' : score >= 15 ? 'med' : 'low'
  return { score, level }
}

export default function HomePage() {
  const [input, setInput] = useState('')
  const [desc, setDesc] = useState('')
  const [deadline, setDeadline] = useState('')
  const [hours, setHours] = useState('')
  const [type, setType] = useState('regular')
  const [estimating, setEstimating] = useState(false)
  const [aiReason, setAiReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [migrateMsg, setMigrateMsg] = useState('')
  const [hasMigrated, setHasMigrated] = useState(false)

  useEffect(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setDeadline(now.toISOString().slice(0, 16))
    const done = localStorage.getItem('migrated_to_supabase')
    setHasMigrated(!!done)
  }, [])

  async function estimate() {
    if (!input.trim()) return
    setEstimating(true)
    setAiReason('')
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: input, description: desc })
      })
      const data = await res.json()
      setHours(String(data.hours))
      setAiReason(data.reason)
    } catch {
      setAiReason('estimate failed — enter hours manually')
    }
    setEstimating(false)
  }

  async function add() {
    if (!input.trim() || !deadline || !hours) return
    setAdding(true)
    const { score, level } = calcPriority(deadline, hours, type)
    await supabase.from('tasks').insert({
      id: uid(),
      text: input.trim(),
      description: desc,
      deadline: new Date(deadline).toISOString(),
      hours: parseFloat(hours),
      type,
      score,
      level,
      done: false
    })
    setInput(''); setDesc(''); setHours(''); setAiReason('')
    setAdding(false)
  }

  async function migrate() {
    setMigrating(true)
    try {
      const raw = localStorage.getItem(OLD_STORE)
      if (!raw) { setMigrateMsg('no local tasks found'); setMigrating(false); return }
      const tasks = JSON.parse(raw)
      if (!tasks.length) { setMigrateMsg('no local tasks found'); setMigrating(false); return }
      const rows = tasks.map(t => ({
        id: t.id || uid(),
        text: t.text,
        description: t.desc || '',
        deadline: new Date(t.deadline).toISOString(),
        hours: parseFloat(t.hours) || 1,
        type: t.type || 'regular',
        score: t.score || 0,
        level: t.level || 'low',
        done: t.done || false
      }))
      const { error } = await supabase.from('tasks').upsert(rows)
      if (error) { setMigrateMsg('migration failed: ' + error.message) }
      else {
        localStorage.setItem('migrated_to_supabase', '1')
        setHasMigrated(true)
        setMigrateMsg(`✓ migrated ${rows.length} tasks!`)
      }
    } catch (e) {
      setMigrateMsg('migration failed')
    }
    setMigrating(false)
  }

  return (
    <div>
      <h1 className={styles.title}>brain dump 🧠</h1>
      <p className={styles.sub}>get it out of your head, figure it out later</p>

      <div className={styles.form}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="what's on your mind?"
          className={styles.mainInput}
        />
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="describe it — helps AI estimate time (optional)"
          className={styles.descInput}
          rows={2}
        />
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label>deadline</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>hours needed</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0.1" step="0.1" placeholder="?" style={{ width: 70 }} />
              <button onClick={estimate} disabled={estimating || !input.trim()} className={styles.aiBtn}>
                {estimating ? '...' : '✦ AI'}
              </button>
            </div>
            {aiReason && <span className={styles.aiHint}>{aiReason}</span>}
          </div>
          <div className={styles.field}>
            <label>type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="regular">regular</option>
              <option value="creative">✦ creative</option>
            </select>
          </div>
          <button onClick={add} disabled={adding} className={styles.addBtn}>
            {adding ? '...' : '+ add'}
          </button>
        </div>
      </div>

      {!hasMigrated && (
        <div className={styles.migrateBox}>
          <p>got existing tasks in your browser? migrate them to Supabase so they're saved forever.</p>
          <button onClick={migrate} disabled={migrating} className={styles.migrateBtn}>
            {migrating ? 'migrating...' : '⬆ migrate local tasks'}
          </button>
          {migrateMsg && <span className={styles.migrateMsg}>{migrateMsg}</span>}
        </div>
      )}
    </div>
  )
}