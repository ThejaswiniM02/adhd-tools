'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './completed.module.css'

function hoursUntil(dl) {
  const h = (new Date(dl).getTime() - Date.now()) / 3600000
  if (h < 0) return 'was overdue'
  return Math.round(h / 24) + 'd deadline'
}

export default function CompletedPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').eq('done', true).order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function undone(id) {
    await supabase.from('tasks').update({ done: false }).eq('id', id)
    fetchTasks()
  }

  async function del(id) {
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  if (loading) return <div className={styles.loading}>loading...</div>

  return (
    <div>
      <h1 className={styles.title}>completed ✓</h1>
      <p className={styles.sub}>{tasks.length} tasks done</p>

      {!tasks.length ? (
        <div className={styles.empty}>nothing completed yet — get to it! 💪</div>
      ) : (
        tasks.map(t => (
          <div key={t.id} className={styles.item}>
            <button className={styles.cb} onClick={() => undone(t.id)} title="mark undone">✓</button>
            <div className={styles.taskBody}>
              <span className={styles.taskText}>{t.text}</span>
              <span className={styles.taskMeta}>{t.hours}h · {hoursUntil(t.deadline)}</span>
            </div>
            <button className={styles.delBtn} onClick={() => del(t.id)}>✕</button>
          </div>
        ))
      )}
    </div>
  )
}