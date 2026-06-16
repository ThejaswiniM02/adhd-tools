'use client'
import { useState, useEffect } from 'react'
import styles from './priority.module.css'

const STORE = 'priority_calc_v2'

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }

function calcScore(t) {
  const now = Date.now()
  const deadline = new Date(t.deadline).getTime()
  const hoursLeft = Math.max((deadline - now) / 3600000, 0.01)
  const hours = parseFloat(t.hours) || 1
  const urgency = Math.min(100, (hours / hoursLeft) * 100)
  const effort = Math.min(30, hours * 3)
  const creative = t.type === 'creative' ? 15 : 0
  return Math.min(100, Math.round(urgency * 0.6 + effort * 0.3 + creative))
}

function hoursUntil(dl) {
  const h = (new Date(dl).getTime() - Date.now()) / 3600000
  if (h < 0) return 'overdue!'
  if (h < 1) return Math.round(h * 60) + 'm left'
  if (h < 24) return h.toFixed(1) + 'h left'
  return Math.round(h / 24) + 'd left'
}

function barColor(s) {
  if (s >= 75) return 'var(--red)'
  if (s >= 45) return 'var(--amber)'
  return 'var(--teal)'
}

export default function PriorityPage() {
  const [tasks, setTasks] = useState([])
  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [hours, setHours] = useState('1')
  const [type, setType] = useState('regular')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE)
      if (raw) setTasks(JSON.parse(raw))
    } catch (e) {}
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setDeadline(now.toISOString().slice(0, 16))
    setMounted(true)
  }, [])

  function save(next) {
    setTasks(next)
    try { localStorage.setItem(STORE, JSON.stringify(next)) } catch (e) {}
  }

  function add() {
    if (!name.trim() || !deadline || !hours) return
    save([...tasks, { id: uid(), name: name.trim(), deadline, hours: parseFloat(hours), type }])
    setName('')
  }

  function del(id) { save(tasks.filter(t => t.id !== id)) }

  const sorted = [...tasks].map(t => ({ ...t, score: calcScore(t) })).sort((a, b) => b.score - a.score)

  if (!mounted) return null

  return (
    <div>
      <h1 className={styles.title}>priority calculator</h1>
      <p className={styles.sub}>add tasks → get a ranked order. creative tasks get a bonus when scores are close.</p>

      <div className={styles.form}>
        <div className={styles.field}>
          <label>task name</label>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="e.g. design mockup" style={{ width: '100%' }} />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>deadline</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>hours needed</label>
            <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0.5" step="0.5" style={{ width: '90px' }} />
          </div>
          <div className={styles.field}>
            <label>type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="creative">✦ creative</option>
              <option value="regular">regular</option>
            </select>
          </div>
        </div>
        <button onClick={add} style={{ alignSelf: 'flex-start' }}>+ add task</button>
      </div>

      {!tasks.length ? (
        <div className={styles.empty}>add at least 2 tasks to see a ranking</div>
      ) : (
        <>
          <p className={styles.sectionHd}>ranked — do these first</p>
          {sorted.map((t, i) => {
            const rankCls = i === 0 ? styles.rank1 : i === 1 ? styles.rank2 : i === 2 ? styles.rank3 : styles.rankN
            return (
              <div key={t.id} className={styles.card}>
                <div className={`${styles.rankBadge} ${rankCls}`}>{i + 1}</div>
                <div className={styles.info}>
                  <div className={styles.taskName}>
                    {t.name}
                    {t.type === 'creative' && <span className={styles.creativeTag}>creative</span>}
                  </div>
                  <div className={styles.meta}>{t.hours}h needed · {hoursUntil(t.deadline)}</div>
                </div>
                <div className={styles.scoreBlock}>
                  <div className={styles.scoreNum}>{t.score}%</div>
                  <div className={styles.scoreLbl}>priority</div>
                  <div className={styles.barWrap}>
                    <div className={styles.barFill} style={{ width: t.score + '%', background: barColor(t.score) }} />
                  </div>
                </div>
                <button className={styles.delBtn} onClick={() => del(t.id)}>✕</button>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
