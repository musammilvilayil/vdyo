import { useMemo, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowUpRight, AudioLines, Bot, Check, ChevronDown, CircleHelp, Clock3, CloudUpload, Film, Filter, Gauge, ImagePlus, MessageCircle, MoreHorizontal, Play, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, WandSparkles, Workflow, X } from 'lucide-react';

const initialOrders = [
  { id: 'VD-1048', name: 'Aarav Nair', type: 'Instagram Reel', detail: 'Restaurant launch · 9:16 · 30 sec', status: 'AI processing', progress: 68, amount: '₹1,499', time: '12 min ago', color: 'violet' },
  { id: 'VD-1047', name: 'Mira Joseph', type: 'YouTube Short', detail: 'Beauty product · captions + music', status: 'Needs review', progress: 92, amount: '₹999', time: '38 min ago', color: 'orange' },
  { id: 'VD-1046', name: 'Northstar Realty', type: 'Property Reel', detail: '3 clips · cinematic · 45 sec', status: 'Files received', progress: 24, amount: '₹2,499', time: '1 hr ago', color: 'blue' },
  { id: 'VD-1045', name: 'Fathima K', type: 'Wedding teaser', detail: 'Highlight edit · 60 sec', status: 'Delivered', progress: 100, amount: '₹4,999', time: 'Yesterday', color: 'green' },
];

const nav = [
  { label: 'Overview', icon: Gauge },
  { label: 'Conversations', icon: MessageCircle, count: '8' },
  { label: 'Video orders', icon: Film },
  { label: 'Automations', icon: Workflow },
];

function Status({ value }) {
  const cls = value === 'Delivered' ? 'success' : value === 'Needs review' ? 'warning' : value === 'AI processing' ? 'processing' : 'neutral';
  return <span className={`status ${cls}`}><i />{value}</span>;
}

function App() {
  const [active, setActive] = useState('Overview');
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState(initialOrders);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { from: 'customer', text: 'Hey! I need a 30-second Instagram reel for my new cafe.', time: '2:41 PM' },
    { from: 'ai', text: 'Absolutely! ☕ I can help with that. Do you have the raw clips ready, and would you like a clean promotional style or a more cinematic edit?', time: '2:41 PM' },
    { from: 'customer', text: 'Cinematic. I have 5 clips and a logo.', time: '2:42 PM' },
    { from: 'ai', text: 'Perfect. I’ve prepared a draft brief: 9:16 vertical, 30 seconds, cinematic pacing, logo end-card. Shall I create the order?', time: '2:42 PM' },
  ]);
  const filtered = useMemo(() => orders.filter(o => [o.id, o.name, o.type].join(' ').toLowerCase().includes(query.toLowerCase())), [orders, query]);

  function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setChat(c => [...c, { from: 'owner', text: message.trim(), time: 'Now' }]);
    setMessage('');
  }

  function createOrder(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('customer') || 'New customer';
    const type = form.get('type') || 'Instagram Reel';
    setOrders(prev => [{ id: `VD-${1050 + prev.length}`, name, type, detail: 'New request · awaiting footage', status: 'Files received', progress: 10, amount: 'To quote', time: 'Just now', color: 'blue' }, ...prev]);
    setShowNew(false);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><WandSparkles size={19}/></div><span>vdyo<span className="brand-dot">.</span></span><span className="brand-tag">STUDIO</span></div>
        <div className="workspace"><div className="workspace-avatar">V</div><div><strong>VDYO Studio</strong><small>Personal workspace</small></div><ChevronDown size={15}/></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>{nav.map(item => <button key={item.label} className={active === item.label ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item.label)}><item.icon size={17}/><span>{item.label}</span>{item.count && <b>{item.count}</b>}</button>)}</nav>
        <div className="nav-label tools-label">STUDIO TOOLS</div>
        <button className="nav-item" onClick={() => setActive('AI video lab')}><Sparkles size={17}/><span>AI video lab</span><span className="soon">BETA</span></button>
        <button className="nav-item" onClick={() => setActive('Media library')}><ImagePlus size={17}/><span>Media library</span></button>
        <button className="nav-item" onClick={() => setActive('Brand kit')}><AudioLines size={17}/><span>Brand kit</span></button>
        <div className="sidebar-bottom"><div className="usage-card"><div className="usage-top"><span>Monthly renders</span><strong>24 / 100</strong></div><div className="usage-track"><i/></div><small>76 renders remaining</small></div><button className="nav-item"><Settings2 size={17}/><span>Settings</span></button><div className="profile"><div className="profile-avatar">MM</div><div><strong>Musammil</strong><small>Studio owner</small></div><MoreHorizontal size={18}/></div></div>
      </aside>

      <main className="main">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div><div className="top-actions"><span className="connection"><i/> WhatsApp connected</span><button className="icon-button"><CircleHelp size={18}/></button><button className="icon-button"><Settings2 size={18}/></button><div className="profile-avatar small">MM</div></div></header>
        <div className="content">
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR STUDIO AT A GLANCE</div><h1>Good afternoon, Musammil <span>✳</span></h1><p>Here’s what’s happening across your video studio today.</p></div><button className="primary-button" onClick={() => setShowNew(true)}><Plus size={17}/> New order</button></section>
          <section className="metrics">
            <Metric icon={MessageCircle} label="WhatsApp conversations" value="128" delta="+18.6%" note="vs last 7 days" color="purple"/>
            <Metric icon={Film} label="Active video orders" value={orders.filter(o => o.status !== 'Delivered').length.toString().padStart(2,'0')} delta="3 in progress" note="Across all services" color="blue"/>
            <Metric icon={WandSparkles} label="AI videos generated" value="86" delta="+24.2%" note="vs last 7 days" color="orange"/>
            <Metric icon={ArrowUpRight} label="Revenue this month" value="₹42,850" delta="+12.8%" note="vs last month" color="green"/>
          </section>
          <section className="hero-grid">
            <div className="hero-card"><div className="hero-copy"><div className="hero-kicker"><Sparkles size={14}/> VDYO AI ASSISTANT</div><h2>Your creative<br/>workflow, on autopilot.</h2><p>Turn WhatsApp requests into ready-to-publish videos. Your AI studio manager handles the busywork while you stay in control.</p><button className="hero-button" onClick={() => setActive('Automations')}>Explore automations <ArrowUpRight size={15}/></button></div><div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-core"><WandSparkles size={36}/></div><div className="art-chip chip-one"><MessageCircle size={15}/></div><div className="art-chip chip-two"><Film size={15}/></div><div className="art-chip chip-three"><AudioLines size={15}/></div></div></div>
            <div className="whatsapp-card"><div className="card-heading"><div><span className="live-dot"/> LIVE INBOX</div><button className="text-button" onClick={() => setActive('Conversations')}>View all <ArrowUpRight size={14}/></button></div><div className="chat-person"><div className="chat-avatar">AN</div><div className="chat-person-info"><strong>Aarav Nair</strong><small>+91 •••••• 4821</small></div><span className="chat-time">2:42 PM</span></div><div className="chat-preview">{chat.slice(-2).map((m,i)=><div key={i} className={`bubble ${m.from === 'ai' || m.from === 'owner' ? 'outgoing' : 'incoming'}`}>{m.text}</div>)}</div><form className="chat-compose" onSubmit={sendMessage}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Reply as studio owner…"/><button aria-label="Send message"><Send size={15}/></button></form></div>
          </section>
          <section className="orders-section"><div className="section-heading"><div><h2>Recent video orders</h2><p>Track every request from WhatsApp to final delivery.</p></div><button className="outline-button" onClick={() => setActive('Video orders')}>All orders <ArrowUpRight size={14}/></button></div>
            <div className="table-toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search orders or customers"/></div><button className="filter-button"><Filter size={15}/> Filters <ChevronDown size={14}/></button></div>
            <div className="orders-table"><div className="table-head"><span>ORDER / CUSTOMER</span><span>VIDEO TYPE</span><span>STATUS</span><span>PROGRESS</span><span>AMOUNT</span><span/></div>{filtered.map(order=><div className="table-row" key={order.id}><div className="order-customer"><div className={`order-avatar ${order.color}`}>{order.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</div><div><strong>{order.id}</strong><small>{order.name}</small></div></div><div className="type-cell"><strong>{order.type}</strong><small>{order.detail}</small></div><div><Status value={order.status}/></div><div className="progress-cell"><div className="progress-top"><span>{order.progress}%</span><small>{order.time}</small></div><div className="progress-track"><i style={{width:`${order.progress}%`}}/></div></div><strong className="amount">{order.amount}</strong><button className="row-more"><MoreHorizontal size={18}/></button></div>)}{filtered.length===0&&<div className="empty-state">No matching orders found.</div>}</div>
          </section>
          <footer className="footer"><span>VDYO Studio <b>·</b> WhatsApp-first AI video operations</span><span><ShieldCheck size={13}/> Your media stays private</span></footer>
        </div>
      </main>
      {showNew && <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowNew(false)}><form className="modal" onSubmit={createOrder}><div className="modal-head"><div><span className="eyebrow">STUDIO WORKFLOW</span><h2>Create a video order</h2></div><button type="button" className="icon-button" onClick={()=>setShowNew(false)}><X size={18}/></button></div><label>Customer name<input name="customer" placeholder="e.g. Aisha Rahman" required/></label><label>Video format<select name="type"><option>Instagram Reel</option><option>YouTube Short</option><option>YouTube Video</option><option>Wedding Highlight</option><option>Promotional Video</option></select></label><div className="modal-note"><CloudUpload size={17}/> Customer footage can be collected securely through a WhatsApp upload flow.</div><div className="modal-actions"><button type="button" className="outline-button" onClick={()=>setShowNew(false)}>Cancel</button><button className="primary-button"><Plus size={16}/> Create order</button></div></form></div>}
    </div>
  );
}

function Metric({icon:Icon,label,value,delta,note,color}) { return <div className="metric-card"><div className="metric-top"><span className={`metric-icon ${color}`}><Icon size={17}/></span><span className="metric-delta">{delta}</span></div><div className="metric-value">{value}</div><div className="metric-label">{label}</div><div className="metric-note">{note}</div></div>; }

export default App;
