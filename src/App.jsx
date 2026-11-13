import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, MapPin, Users, Utensils, CheckCircle2, Clock3, ExternalLink, Heart, RefreshCw } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const FALLBACK_MENU = [
  { id: 'preview-1', name: 'Southern Fried Chicken', category: 'Main Dishes', sort_order: 1 },
  { id: 'preview-2', name: 'Baked Macaroni & Cheese', category: 'Side Dishes', sort_order: 2 },
  { id: 'preview-3', name: 'Mashed Potatoes', category: 'Side Dishes', sort_order: 3 },
  { id: 'preview-4', name: 'Candied Yams', category: 'Side Dishes', sort_order: 4 },
  { id: 'preview-5', name: 'Green Beans', category: 'Side Dishes', sort_order: 5 },
  { id: 'preview-6', name: 'Collard Greens', category: 'Side Dishes', sort_order: 6 },
  { id: 'preview-7', name: 'Southern Cabbage', category: 'Side Dishes', sort_order: 7 },
  { id: 'preview-8', name: 'Deviled Eggs', category: 'Sides & Extras', sort_order: 8 },
  { id: 'preview-9', name: 'Southern Potato Salad', category: 'Sides & Extras', sort_order: 9 },
  { id: 'preview-10', name: 'Broccoli Salad', category: 'Sides & Extras', sort_order: 10 },
  { id: 'preview-11', name: 'Sweet Potato Pie', category: 'Desserts', sort_order: 11 },
  { id: 'preview-12', name: 'Pecan Pie', category: 'Desserts', sort_order: 12 },
  { id: 'preview-13', name: 'Banana Pudding', category: 'Desserts', sort_order: 13 },
  { id: 'preview-14', name: 'Peach Cobbler', category: 'Desserts', sort_order: 14 },
  { id: 'preview-15', name: 'Homemade Lemonade', category: 'Drinks', sort_order: 15 },
  { id: 'preview-16', name: 'Sweet Tea', category: 'Drinks', sort_order: 16 },
  { id: 'preview-17', name: 'Apple Cider', category: 'Drinks', sort_order: 17 }
]

function App() {
  const [menu, setMenu] = useState(FALLBACK_MENU)
  const [claims, setClaims] = useState([])
  const [rsvps, setRsvps] = useState([])
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState('yes')
  const [selectedDish, setSelectedDish] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const claimedIds = useMemo(() => new Set(claims.map(c => c.menu_item_id)), [claims])
  const claimedCount = claims.length
  const categories = useMemo(() => [...new Set(menu.map(item => item.category))], [menu])

  async function loadData() {
    if (!isSupabaseConfigured) return
    setLoading(true)
    const [menuRes, claimRes, rsvpRes] = await Promise.all([
      supabase.from('menu_items').select('*').eq('active', true).order('sort_order'),
      supabase.from('dish_claims').select('id, menu_item_id, guest_name, created_at'),
      supabase.from('rsvps').select('id, guest_name, attending, created_at').order('created_at', { ascending: false })
    ])
    if (menuRes.error || claimRes.error || rsvpRes.error) {
      setMessage(menuRes.error?.message || claimRes.error?.message || rsvpRes.error?.message || 'Could not load the shared signup.')
    } else {
      setMenu(menuRes.data || [])
      setClaims(claimRes.data || [])
      setRsvps(rsvpRes.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    if (!isSupabaseConfigured) return
    const channel = supabase.channel('thanksgiving-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dish_claims' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function submitRsvp(e) {
    e.preventDefault()
    if (!name.trim()) return setMessage('Please enter your name first.')
    if (!isSupabaseConfigured) return setMessage('Connect the Supabase project to enable shared RSVPs.')
    setBusy(true); setMessage('')
    const { error } = await supabase.from('rsvps').insert({
      guest_name: name.trim(),
      attending: attendance === 'yes'
    })
    setBusy(false)
    if (error) setMessage(error.message)
    else { setMessage('Your RSVP has been saved. Thank you!'); await loadData() }
  }

  async function claimDish(e) {
    e.preventDefault()
    if (!name.trim()) return setMessage('Enter your name before claiming a dish.')
    if (!selectedDish) return setMessage('Choose an available dish.')
    if (!isSupabaseConfigured) return setMessage('Connect the Supabase project to enable shared dish claims.')
    setBusy(true); setMessage('')
    const { error } = await supabase.rpc('claim_dish', {
      p_menu_item_id: selectedDish,
      p_guest_name: name.trim()
    })
    setBusy(false)
    if (error) setMessage(error.message.includes('already claimed') ? 'Someone just claimed that dish. Refresh the list and choose another.' : error.message)
    else { setMessage('You claimed your dish! The family list is updated.'); setSelectedDish(''); await loadData() }
  }

  const available = menu.filter(item => !claimedIds.has(item.id))
  const guestCount = rsvps.filter(r => r.attending).length

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-top"><span>THE JOSEPH FAMILY</span><span className="year-pill">THANKSGIVING 2026</span></div>
        <div className="hero-content">
          <p className="eyebrow">GOOD FOOD • FAMILY • FELLOWSHIP</p>
          <h1>Thanksgiving<br /><em>at the Josephs</em></h1>
          <p className="hero-sub">A day to gather, give thanks, and enjoy each other.</p>
          <div className="event-meta">
            <span><CalendarDays size={17}/> Tuesday, November 24, 2026</span>
            <span><MapPin size={17}/> 880 Hwy 6 South, Houston, TX 77079</span>
          </div>
          <a className="map-link" href="https://www.google.com/maps/search/?api=1&query=880+Hwy+6+South+Houston+TX+77079" target="_blank" rel="noreferrer">Get directions <ExternalLink size={14}/></a>
        </div>
        <div className="hero-bottom"><span>YOU'RE INVITED</span><Heart size={17} fill="currentColor"/><span>COME HUNGRY</span></div>
      </header>

      {!isSupabaseConfigured && <div className="setup-alert"><strong>Preview mode:</strong> This app is ready for its shared database. Follow SETUP.md to connect Supabase before sharing it with family.</div>}
      {message && <div className="notice" role="status">{message}<button onClick={() => setMessage('')} aria-label="Dismiss">×</button></div>}

      <main>
        <section className="intro section-card">
          <div className="section-kicker">01 / A FAMILY GATHERING</div>
          <h2>We saved you a seat.</h2>
          <p>Family, let's get ready for Thanksgiving! Please RSVP and choose a dish to bring. The signup list updates for everyone, so we can make sure our table is full and our contributions are covered.</p>
          <div className="stat-row">
            <div><strong>{guestCount}</strong><span>Guests coming</span></div>
            <div><strong>{claimedCount}/{menu.length}</strong><span>Dishes claimed</span></div>
            <div><strong>{available.length}</strong><span>Still available</span></div>
          </div>
        </section>

        <section className="section-card">
          <div className="section-kicker">02 / LET US KNOW</div>
          <h2>Are you joining us?</h2>
          <form onSubmit={submitRsvp} className="form-stack">
            <label>Your name<input value={name} onChange={e => setName(e.target.value)} placeholder="First and last name" maxLength={80}/></label>
            <div className="choice-row">
              <label className={attendance === 'yes' ? 'choice selected' : 'choice'}><input type="radio" checked={attendance === 'yes'} onChange={() => setAttendance('yes')}/> Yes, I'll be there</label>
              <label className={attendance === 'no' ? 'choice selected' : 'choice'}><input type="radio" checked={attendance === 'no'} onChange={() => setAttendance('no')}/> Can't make it</label>
            </div>
            <button className="button primary" disabled={busy || !isSupabaseConfigured}>{busy ? 'Saving…' : 'Submit RSVP'}</button>
          </form>
          {rsvps.length > 0 && <div className="rsvp-list"><h3>Family RSVPs</h3>{rsvps.map(r => <div className="rsvp-person" key={r.id}><span>{r.guest_name}</span><span className={r.attending ? 'status yes' : 'status no'}>{r.attending ? 'Coming' : 'Not attending'}</span></div>)}</div>}
        </section>

        <section className="section-card">
          <div className="section-kicker">03 / BRING SOMETHING TO THE TABLE</div>
          <h2>Claim your dish.</h2>
          <p className="muted">Choose an available item below. Once claimed, your name appears beside it for the whole family to see.</p>
          <div className="progress-wrap"><div className="progress-label"><span>Potluck progress</span><strong>{claimedCount} of {menu.length}</strong></div><div className="progress"><span style={{width: `${menu.length ? claimedCount / menu.length * 100 : 0}%`}}/></div></div>
          <form onSubmit={claimDish} className="claim-form">
            <label>Your name<input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" maxLength={80}/></label>
            <label>Available dish<select value={selectedDish} onChange={e => setSelectedDish(e.target.value)}><option value="">Select a dish…</option>{available.map(item => <option key={item.id} value={item.id}>{item.name} — {item.category}</option>)}</select></label>
            <button className="button primary" disabled={busy || !isSupabaseConfigured || available.length === 0}>{busy ? 'Saving…' : 'Claim this dish'}</button>
          </form>
          {loading && <p className="muted loading"><RefreshCw size={15}/> Loading shared signup…</p>}
          <div className="menu-list">
            {categories.map(category => <div className="menu-category" key={category}>
              <h3>{category}</h3>
              {menu.filter(item => item.category === category).map(item => {
                const claim = claims.find(c => c.menu_item_id === item.id)
                return <div className="menu-item" key={item.id}>
                  <div><strong>{item.name}</strong><small>{claim ? `Bringing: ${claim.guest_name}` : 'Waiting for a family member'}</small></div>
                  <span className={claim ? 'status yes' : 'status open'}>{claim ? <><CheckCircle2 size={14}/> Claimed</> : <><Clock3 size={14}/> Available</>}</span>
                </div>
              })}
            </div>)}
          </div>
          {available.length === 0 && menu.length > 0 && <div className="all-claimed">Every menu item has been claimed. Thank you, family!</div>}
          <button className="button secondary refresh" onClick={loadData} disabled={!isSupabaseConfigured}><RefreshCw size={15}/> Refresh signup</button>
        </section>
      </main>
      <footer><div className="footer-mark">J</div><h2>Family makes it special.</h2><p>We look forward to celebrating with everyone.</p><span>JOSEPH FAMILY • THANKSGIVING 2026</span></footer>
      <div className="privacy-note"><Users size={14}/> Anyone with the link can view the RSVP and dish list. Please only enter information you are comfortable sharing with the family.</div>
    </div>
  )
}

export default App
