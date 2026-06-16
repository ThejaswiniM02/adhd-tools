'use client'
import { useState, useEffect } from 'react'
import styles from './todo.module.css'

const STORE = 'adhd_todos_v4'
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

function hoursUntil(dl) {
  const h = (new Date(dl).getTime() - Date.now()) / 3600000
  if (h < 0) return '⚠️ overdue'
  if (h < 1) return Math.round(h * 60) + 'm left'
  if (h < 24) return h.toFixed(1) + 'h left'
  return Math.round(h / 24) + 'd left'
}

export default function TodoPage() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [desc, setDesc] = useState('')
  const [deadline, setDeadline] = useState('')
  const [hours, setHours] = useState('')
  const [type, setType] = useState('regular')
  const [estimating, setEstimating] = useState(false)
  const [aiReason, setAiReason] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try { const r = localStorage.getItem(STORE); if (r) setTodos(JSON.parse(r)) } catch (e) {}
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setDeadline(now.toISOString().slice(0, 16))
    setMounted(true)
  }, [])

  function save(next) {
    setTodos(next)
    try { localStorage.setItem(STORE, JSON.stringify(next)) } catch (e) {}
  }

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
    } catch (e) {
      setAiReason('estimate failed, enter hours manually')
    }
    setEstimating(false)
  }

  function add() {
    if (!input.trim() || !deadline || !hours) return
    const { score, level } = calcPriority(deadline, hours, type)
    save([{ id: uid(), text: input.trim(), desc, deadline, hours: parseFloat(hours), type, score, level, done: false, ts: Date.now() }, ...todos])
    setInput(''); setDesc(''); setHours(''); setAiReason('')
  }

  function toggle(id) { save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function del(id) { save(todos.filter(t => t.id !== id)) }

  const scored = todos.map(t => ({ ...t, ...calcPriority(t.deadline, t.hours, t.type) }))
  const active = scored.filter(t => !t.done).sort((a, b) => b.score - a.score)
  const done = scored.filter(t => t.done)
  const total = todos.length
  const doneCount = todos.filter(t => t.done).length
  const pct = total ? Math.round((doneCount / total) * 100) : 0
  const priDot = { high: styles.priHigh, med: styles.priMed, low: styles.priLow }
  const priLabel = { high: '🔴', med: '🟡', low: '🟢' }

  if (!mounted) return null

  return (
    <div>
      <h1 className={styles.title}>brain dump 🧠</h1>
      <p className={styles.sub}>get it out of your head</p>

      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statNum}>{total}</span><span className={styles.statLbl}>total</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{doneCount}</span><span className={styles.statLbl}>done</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{total - doneCount}</span><span className={styles.statLbl}>left</span></div>
      </div>
      <div className={styles.progBar}><div className={styles.progFill} style={{ width: pct + '%' }} /></div>

      <div className={styles.form}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="what's on your mind?" className={styles.mainInput} />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="describe it (optional — helps AI estimate time)" className={styles.descInput} rows={2} />
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label>deadline</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>hours needed</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0.1" step="0.1" style={{ width: 70 }} />
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
          <button onClick={add} className={styles.addBtn}>+ add</button>
        </div>
      </div>

      {!todos.length ? (
        <div className={styles.empty}>nothing yet — dump your thoughts above ☝️</div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <p className={styles.sectionHd}>to do · sorted by priority</p>
              {active.map(t => (
                <div key={t.id} className={styles.item}>
                  <button className={styles.cb} onClick={() => toggle(t.id)} aria-label="mark done" />
                  <span className={`${styles.priDot} ${priDot[t.level]}`} />
                  <div className={styles.taskBody}>
                    <span className={styles.taskText}>{t.text}{t.type === 'creative' && <span className={styles.creativeTag}>creative</span>}</span>
                    <span className={styles.taskMeta}>{priLabel[t.level]} {t.score}% · {hoursUntil(t.deadline)} · {t.hours}h</span>
                  </div>
                  <a href={`/tasks?edit=${t.id}`} className={styles.editBtn}>✎</a>
                  <button className={styles.delBtn} onClick={() => del(t.id)}>✕</button>
                </div>
              ))}
            </>
          )}
          {done.length > 0 && (
            <>
              <p className={styles.sectionHd}>completed ✓</p>
              {done.map(t => (
                <div key={t.id} className={`${styles.item} ${styles.itemDone}`}>
                  <button className={`${styles.cb} ${styles.cbChecked}`} onClick={() => toggle(t.id)}>✓</button>
                  <span className={`${styles.priDot} ${priDot[t.level]}`} />
                  <div className={styles.taskBody}>
                    <span className={`${styles.taskText} ${styles.taskDone}`}>{t.text}</span>
                    <span className={styles.taskMeta}>{hoursUntil(t.deadline)}</span>
                  </div>
                  <button className={styles.delBtn} onClick={() => del(t.id)}>✕</button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}