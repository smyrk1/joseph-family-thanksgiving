import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'

const dishes = [
  { category: 'Main dishes', items: ['Roasted turkey', 'Baked chicken', 'Fried fish'] },
  { category: 'Sides', items: ['Dressing', 'Macaroni and cheese', 'Green beans', 'Yams', 'Mashed potatoes', 'Potato salad', 'Deviled eggs', 'Dinner rolls', 'Rice'] },
  { category: 'Desserts', items: ['Sweet potato pie', 'Peach cobbler', 'Pound cake', 'Banana pudding', 'Apple pie'] },
  { category: 'Drinks', items: ['Water', 'Lemonade', 'Tea', 'Assorted soft drinks'] },
  { category: 'Other', items: ['Other dish (describe below)', 'Ice', 'Plates, cups, and utensils'] }
]

export default function App() {
  const [signups, setSignups] = useState([])
  const [name, setName] = useState('')
  const [dish, setDish] = useState('')
  const [details, setDetails] = useState('')
  const [guests, setGuests] = useState('1')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadSignups() {
    if (!isSupabaseConfigured) return
    const { data, error } = await supabase.from('thanksgiving_signups').select('*').order('created_at')
    if (!error) setSignups(data || [])
  }

  useEffect(() => { loadSignups() }, [])

  async function submit(e) {
    e.preventDefault()
    if (!name.trim() || !dish) {
      setMessage('Please enter your name and choose what you are bringing.')
      return
    }
    setBusy(true)
    const record = { name: name.trim(), dish, details: details.trim(), guests: Number(guests) || 1 }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('thanksgiving_signups').insert(record)
      if (error) {
        setMessage(`Could not save your sign-up: ${error.message}`)
        setBusy(false)
        return
      }
      await loadSignups()
      setMessage('You are on the list. Thank you for contributing!')
    } else {
      const current = JSON.parse(localStorage.getItem('joseph-thanksgiving-signups') || '[]')
      const updated = [...current, { ...record, id: crypto.randomUUID() }]
      localStorage.setItem('joseph-thanksgiving-signups', JSON.stringify(updated))
      setSignups(updated)
      setMessage('Saved on this device. Connect Supabase to share sign-ups with the whole family.')
    }
    setName(''); setDish(''); setDetails(''); setGuests('1'); setBusy(false)
  }

  const grouped = dishes.map(group => ({ ...group, items: group.items.filter(item => !signups.some(s => s.dish === item)) }))

  return <main className="page">
    <header className="hero">
      <div className="eyebrow">FAMILY • FOOD • GRATITUDE</div>
      <h1>Joseph Family<br/><em>Thanksgiving</em></h1>
      <p className="intro">Good food is better when we bring it together. Let the family know what you’ll be bringing!</p>
      <div className="event">
        <div><span>WHEN</span><strong>November 24, 2026</strong></div>
        <div><span>WHERE</span><strong>880 Hwy 6 South, Houston, TX 77079</strong></div>
      </div>
    </header>

    <section className="content">
      <div className="section-heading"><span>01 / SIGN UP</span><h2>What are you bringing?</h2><p>Choose an item, add your name, and submit your contribution.</p></div>
      <form onSubmit={submit} className="signup">
        <label>Your name<input value={name} onChange={e => setName(e.target.value)} placeholder="First and last name" required /></label>
        <label>Choose your contribution<select value={dish} onChange={e => setDish(e.target.value)} required>
          <option value="">Select a dish or item</option>
          {dishes.map(group => <optgroup key={group.category} label={group.category}>{group.items.map(item => <option key={item} value={item}>{item}</option>)}</optgroup>)}
        </select></label>
        <label>Additional details <span className="optional">(optional)</span><input value={details} onChange={e => setDetails(e.target.value)} placeholder="What should the family know?" /></label>
        <label>How many people are you bringing?<select value={guests} onChange={e => setGuests(e.target.value)}>{[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <button disabled={busy}>{busy ? 'Submitting…' : 'Add my contribution'}</button>
        {message && <p className="message" role="status">{message}</p>}
      </form>

      <div className="section-heading list-heading"><span>02 / FAMILY POTLUCK</span><h2>What’s already covered</h2><p>Items still available are shown below.</p></div>
      <div className="menu-grid">{grouped.map(group => <article className="menu-card" key={group.category}>
        <h3>{group.category}</h3>
        {group.items.length ? <ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul> : <p className="muted">All listed items claimed</p>}
      </article>)}</div>

      <div className="section-heading list-heading"><span>03 / THE FAMILY TABLE</span><h2>Family contributions</h2></div>
      {signups.length ? <div className="signup-list">{signups.map(s => <div className="signup-row" key={s.id}><div><strong>{s.dish}</strong><span>{s.name}{s.details ? ` · ${s.details}` : ''}</span></div><small>{s.guests} guest{s.guests === 1 ? '' : 's'}</small></div>)}</div> : <div className="empty">The list is waiting for the first family contribution. Be the first to sign up!</div>}
    </section>
    <footer>Made with love for the Joseph Family <span>♡</span></footer>
  </main>
}
