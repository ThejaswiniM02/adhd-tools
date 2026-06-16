'use client'
import { useState, useEffect } from 'react'
import styles from './todo.module.css'

const STORE = 'adhd_todos_v2'

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

export default function TodoPage() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [pri, setPri] = useState('med')
  const [filter, setFilter] = useState('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE)
      if (raw) setTodos(JSON.parse(raw))
    } catch (e) {}
    setMounted(true)
  }, [])

  function save(next) {
    setTodos(next)
    try { localStorage.setItem(STORE, JSON.stringify(next)) } catch (e) {}
  }

  function add() {
    if (!input.trim()) return
    save([{ id: uid(), text: input.trim(), pri, done: false, ts: Date.now() }, ...todos])
    setInput('')
  }

  function toggle(id) {
    save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function del(id) {
    save(todos.filter(t => t.id !== id))
  }

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    if (filter === 'high') return t.pri === 'high'
    return true
  })

  const active = filtered.filter(t => !t.done)
  const done = filtered.filter(t => t.done)
  const total = todos.length
  const doneCount = todos.filter(t => t.done).length
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  const priDot = { high: styles.priHigh, med: styles.priMed, low: styles.priLow }

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

      <div className={styles.progBar}>
        <div className={styles.progFill} style={{ width: pct + '%' }} />
      </div>

      <div className={styles.addRow}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="what's on your mind?"
          style={{ flex: 1 }}
        />
        <select value={pri} onChange={e => setPri(e.target.value)}>
          <option value="high">🔴 high</option>
          <option value="med">🟡 medium</option>
          <option value="low">🟢 low</option>
        </select>
        <button onClick={add}>+ add</button>
      </div>

      <div className={styles.filters}>
        {['all', 'active', 'done', 'high'].map(f => (
          <button
            key={f}
            className={filter === f ? styles.filterActive : styles.filterBtn}
            onClick={() => setFilter(f)}
          >
            {f === 'high' ? '🔴 urgent' : f}
          </button>
        ))}
      </div>

      {!filtered.length && (
        <div className={styles.empty}>
          {!todos.length ? 'nothing yet — dump your thoughts above ☝️' : 'no tasks match this filter'}
        </div>
      )}

      {active.length > 0 && (
        <>
          <p className={styles.sectionHd}>to do</p>
          {active.map(t => (
            <div key={t.id} className={styles.item}>
              <button className={styles.cb} onClick={() => toggle(t.id)} aria-label="mark done" />
              <span className={`${styles.priDot} ${priDot[t.pri]}`} />
              <span className={styles.taskText} onClick={() => toggle(t.id)}>{t.text}</span>
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
              <button className={`${styles.cb} ${styles.cbChecked}`} onClick={() => toggle(t.id)} aria-label="mark undone">✓</button>
              <span className={`${styles.priDot} ${priDot[t.pri]}`} />
              <span className={`${styles.taskText} ${styles.taskDone}`} onClick={() => toggle(t.id)}>{t.text}</span>
              <button className={styles.delBtn} onClick={() => del(t.id)}>✕</button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
