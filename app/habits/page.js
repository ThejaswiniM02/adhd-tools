'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './habits.module.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

export default function HabitsPage() {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [selectedDays, setSelectedDays] = useState([0,1,2,3,4,5,6])
  const [adding, setAdding] = useState(false)
  const today = new Date().getDay()
  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => { fetchHabits() }, [])

  async function fetchHabits() {
    const { data } = await supabase.from('habits').select('*').order('created_at')
    setHabits(data || [])
    setLoading(false)
  }

  function toggleDay(d) {
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function add() {
    if (!name.trim() || !selectedDays.length) return
    setAdding(true)
    await supabase.from('habits').insert({ id: uid(), name: name.trim(), days: selectedDays, streak: 0, last_completed: null })
    setName(''); setSelectedDays([0,1,2,3,4,5,6])
    fetchHabits()
    setAdding(false)
  }

  async function complete(habit) {
    if (habit.last_completed === todayStr) return
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)
    const streak = habit.last_completed === yStr ? habit.streak + 1 : 1
    await supabase.from('habits').update({ streak, last_completed: todayStr }).eq('id', habit.id)
    fetchHabits()
  }

  async function reset(id) {
    await supabase.from('habits').update({ streak: 0, last_completed: null }).eq('id', id)
    fetchHabits()
  }

  async function del(id) {
    await supabase.from('habits').delete().eq('id', id)
    fetchHabits()
  }

  if (loading) return <div className={styles.loading}>loading...</div>

  const todayHabits = habits.filter(h => h.days.includes(today))
  const otherHabits = habits.filter(h => !h.days.includes(today))

  return (
    <div>
      <h1 className={styles.title}>habits 🔥</h1>
      <p className={styles.sub}>build the streak</p>

      

      {todayHabits.length > 0 && (
        <>
          <p className={styles.sectionHd}>today</p>
          {todayHabits.map(h => {
            const done = h.last_completed === todayStr
            return (
              <div key={h.id} className={`${styles.item} ${done ? styles.itemDone : ''}`}>
                <button className={`${styles.cb} ${done ? styles.cbChecked : ''}`} onClick={() => complete(h)}>{done ? '✓' : ''}</button>
                <div className={styles.habitBody}>
                  <span className={styles.habitName}>{h.name}</span>
                  <span className={styles.habitMeta}>{DAYS.filter((_, i) => h.days.includes(i)).join(' · ')}</span>
                </div>
                <span className={styles.streak}>🔥 {h.streak}</span>
                <button className={styles.resetBtn} onClick={() => reset(h.id)} title="reset streak">↺</button>
                <button className={styles.delBtn} onClick={() => del(h.id)}>✕</button>
              </div>
            )
          })}
        </>
      )}

      {otherHabits.length > 0 && (
        <>
          <p className={styles.sectionHd}>not today</p>
          {otherHabits.map(h => (
            <div key={h.id} className={`${styles.item} ${styles.itemOff}`}>
              <div className={styles.habitBody}>
                <span className={styles.habitName}>{h.name}</span>
                <span className={styles.habitMeta}>{DAYS.filter((_, i) => h.days.includes(i)).join(' · ')}</span>
              </div>
              <span className={styles.streak}>🔥 {h.streak}</span>
              <button className={styles.delBtn} onClick={() => del(h.id)}>✕</button>
            </div>
          ))}
        </>
      )}

      {!habits.length && <div className={styles.empty}>no habits yet — add one above!</div>}
    </div>
  )
}