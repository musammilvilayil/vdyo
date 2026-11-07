import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowUpRight, CheckCircle2, ChevronRight, Clapperboard, CloudUpload, Film, FileVideo2, FolderOpen, Gauge, LoaderCircle, Plus, RefreshCw, Search, Settings2, Sparkles, WandSparkles, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';
const statusTone = { ready: 'green', failed: 'red', rendering: 'violet', editing: 'violet', analysing: 'violet', queued: 'blue', awaiting_uploads: 'amber', quality_check: 'blue', draft: 'muted' };
const pretty = value => (value || 'unknown').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';

async function request(path, options = {}) {
  const response = await fetch(`${API}/api${path}`, { ...options, headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || 'Request failed. Check the API configuration.');
  return data;
}

function App() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [health, setHealth] = useState(null);
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [projectData, healthData] = await Promise.all([request('/projects'), request('/health/')]);
      setProjects(projectData.projects || []);
      setHealth(healthData.dependencies || null);
      setError('');
    } catch (err) { setError(err.message); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!selected?._id) return;
    const timer = setInterval(async () => {
      try {
        const data = await request(`/projects/${selected._id}`);
        setSelected(data.project);
        setProjects(current => current.map(item => item._id === data.project._id ? data.project : item));
      } catch {}
    }, 7000);
    return () => clearInterval(timer);
  }, [selected?._id]);

  const filtered = useMemo(() => projects.filter(project => [project.title, project.projectCode, project.customer?.name, project.format].join(' ').toLowerCase().includes(query.toLowerCase())), [projects, query]);
  const activeCount = projects.filter(project => !['ready','failed','cancelled'].includes(project.status)).length;
  const readyCount = projects.filter(project => project.status === 'ready').length;

  async function createProject(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      customer: { name: form.get('customer'), email: form.get('email') || undefined },
      title: form.get('title'), format: form.get('format'), aspectRatio: form.get('aspectRatio'),
      targetDurationSeconds: Number(form.get('duration')), style: form.get('style'), instructions: form.get('instructions')
    };
    try {
      const data = await request('/projects', { method: 'POST', body: JSON.stringify(payload) });
      setShowCreate(false); setSelected(data.project); setNotice('Project created. Upload source footage to start the AI workflow.'); await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function uploadFiles(files) {
    if (!selected?._id || !files?.length) return;
    setBusy(true); setError(''); setNotice('');
    try {
      for (const file of Array.from(files)) {
        const intent = await request(`/projects/${selected._id}/uploads`, { method: 'POST', body: JSON.stringify({ fileName: file.name, mimeType: file.type || 'application/octet-stream', size: file.size }) });
        const upload = await fetch(intent.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        if (!upload.ok) throw new Error(`Upload failed for ${file.name}. Check the object-storage CORS policy.`);
        await request(`/projects/${selected._id}/uploads/complete`, { method: 'POST', body: JSON.stringify({ key: intent.key }) });
      }
      const data = await request(`/projects/${selected._id}`);
      setSelected(data.project); setProjects(current => current.map(item => item._id === data.project._id ? data.project : item));
      setNotice('Uploads verified. Your source files are ready for processing.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function startAI() {
    if (!selected) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await request(`/projects/${selected._id}/process`, { method: 'POST', body: JSON.stringify({}) });
      setSelected(data.project); setNotice('AI brief generated and processing job queued.');
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function openProject(project) {
    setSelected(project);
    try { const data = await request(`/projects/${project._id}`); setSelected(data.project); }
    catch (err) { setError(err.message); }
  }

  return <div className="studio-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-icon"><WandSparkles size={19}/></span><span>vdyo<span className="brand-period">.</span></span><small>STUDIO</small></a>
      <div className="workspace-switch"><span className="workspace-avatar">V</span><span><b>VDYO Studio</b><small>AI video workspace</small></span><ChevronRight size={15}/></div>
      <div className="nav-caption">WORKSPACE</div>
      <button className="side-link active"><Gauge size={17}/> Overview</button>
      <button className="side-link" onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}><Film size={17}/> Video projects <span className="side-count">{projects.length}</span></button>
      <button className="side-link" onClick={() => setShowCreate(true)}><Plus size={17}/> New project</button>
      <div className="nav-caption tools-caption">AI WORKFLOW</div>
      <div className="workflow-mini"><span><Sparkles size={15}/></span><div><b>AI Director</b><small>Brief & edit planning</small></div><i className={health?.ai?.configured ? 'on' : ''}/></div>
      <div className="workflow-mini"><span><Clapperboard size={15}/></span><div><b>Render engine</b><small>FFmpeg worker</small></div><i className="off"/></div>
      <div className="sidebar-bottom">
        <div className="privacy-note"><CheckCircle2 size={15}/><span><b>Private by design</b><small>Media is stored in private buckets.</small></span></div>
        <button className="side-link"><Settings2 size={17}/> Settings</button>
        <div className="user-card"><div className="user-avatar">MM</div><span><b>Studio owner</b><small>Workspace admin</small></span></div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>Overview</b></div><div className="topbar-right"><span className={health ? 'api-state online' : 'api-state'}><i/>{health ? 'API reachable' : 'Connecting to API'}</span><button className="round-button" onClick={load} aria-label="Refresh"><RefreshCw size={16}/></button><div className="user-avatar tiny">MM</div></div></header>
      <div className="page-content">
        <section className="welcome"><div><div className="overline"><span/> YOUR AI VIDEO WORKSPACE</div><h1>Make every frame <em>count.</em></h1><p>Turn raw footage into publish-ready videos with an intelligent editing workflow.</p></div><button className="primary-btn" onClick={() => setShowCreate(true)}><Plus size={17}/> Create project</button></section>
        {error && <div className="alert error"><span>{error}</span><button onClick={() => setError('')}><X size={15}/></button></div>}
        {notice && <div className="alert success"><CheckCircle2 size={16}/><span>{notice}</span><button onClick={() => setNotice('')}><X size={15}/></button></div>}
        <section className="stat-grid">
          <Stat icon={Film} label="Total projects" value={projects.length} note="Across your workspace"/>
          <Stat icon={Activity} label="In progress" value={activeCount} note="Active editing workflows"/>
          <Stat icon={CheckCircle2} label="Ready to deliver" value={readyCount} note="Quality check completed"/>
          <Stat icon={Sparkles} label="AI automation" value={health?.ai?.configured ? 'Connected' : 'Setup needed'} note="AI Director availability"/>
        </section>
        <section className="hero-panel"><div className="hero-content"><div className="hero-label"><Sparkles size={14}/> INTRODUCING YOUR AI DIRECTOR</div><h2>From raw footage<br/>to a finished story.</h2><p>Describe the video you want. VDYO builds an editing brief, organises your assets and orchestrates the production pipeline.</p><button className="hero-cta" onClick={() => setShowCreate(true)}>Start a new edit <ArrowUpRight size={16}/></button></div><div className="hero-visual"><div className="visual-ring ring-a"/><div className="visual-ring ring-b"/><div className="visual-core"><WandSparkles size={38}/></div><div className="visual-tag tag-top"><FileVideo2 size={14}/> Raw footage</div><div className="visual-tag tag-bottom"><Sparkles size={14}/> AI edit plan</div></div></section>

        <section className="projects-section" id="projects"><div className="section-title"><div><div className="overline">YOUR WORK</div><h2>Video projects</h2><p>Manage source files, AI editing and final exports.</p></div><button className="secondary-btn" onClick={load}><RefreshCw size={14}/> Refresh</button></div>
          <div className="project-toolbar"><div className="search-field"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects or customers"/></div><span className="result-count">{filtered.length} projects</span></div>
          <div className="project-list">
            {filtered.map(project => <button className={selected?._id === project._id ? 'project-row selected' : 'project-row'} key={project._id} onClick={() => openProject(project)}>
              <div className="project-thumb"><Film size={20}/></div><div className="project-main"><b>{project.title}</b><small>{project.projectCode} · {project.customer?.name || 'Customer'} · {pretty(project.format)}</small></div><div className="project-progress"><div className="progress-line"><i style={{ width: `${project.progress || 0}%` }}/></div><small>{project.progress || 0}%</small></div><span className={`status-pill ${statusTone[project.status] || 'muted'}`}>{pretty(project.status)}</span><span className="project-date">{formatDate(project.updatedAt)}</span><ChevronRight size={16} className="row-chevron"/>
            </button>)}
            {!filtered.length && <div className="empty-projects"><FolderOpen size={27}/><b>{projects.length ? 'No matching projects' : 'Your next great edit starts here'}</b><span>{projects.length ? 'Try another search.' : 'Create a project and upload your raw footage to begin.'}</span>{!projects.length && <button className="primary-btn" onClick={() => setShowCreate(true)}><Plus size={16}/> Create your first project</button>}</div>}
          </div>
        </section>
        <footer className="page-footer"><span>VDYO Studio <i>·</i> AI-powered video production</span><span><CheckCircle2 size={13}/> Secure workspace</span></footer>
      </div>
    </main>

    {selected && <div className="drawer-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelected(null)}><aside className="project-drawer"><div className="drawer-head"><div><div className="overline">PROJECT DETAILS</div><h2>{selected.title}</h2><small>{selected.projectCode} · {selected.customer?.name}</small></div><button className="round-button" onClick={() => setSelected(null)}><X size={17}/></button></div>
      <div className="drawer-status"><span className={`status-pill ${statusTone[selected.status] || 'muted'}`}>{pretty(selected.status)}</span><span>{selected.progress || 0}% complete</span></div><div className="large-progress"><i style={{ width: `${selected.progress || 0}%` }}/></div>
      <div className="drawer-block"><h3>Editing brief</h3><p>{selected.aiBrief?.creativeDirection || selected.instructions || 'Create a project brief and upload footage to let the AI Director plan the edit.'}</p>{selected.aiBrief?.hook && <div className="brief-hook"><b>Opening hook</b><span>{selected.aiBrief.hook}</span></div>}</div>
      <div className="drawer-block"><div className="block-heading"><h3>Source media</h3><button className="text-action" onClick={() => fileRef.current?.click()}><Plus size={14}/> Add files</button></div><input ref={fileRef} hidden type="file" multiple accept="video/*,image/*,audio/*" onChange={event => uploadFiles(event.target.files)}/>{selected.assets?.length ? selected.assets.map(asset => <div className="asset-row" key={asset._id || asset.key}><FileVideo2 size={17}/><span><b>{asset.originalName}</b><small>{(asset.size / 1024 / 1024).toFixed(1)} MB · {pretty(asset.status)}</small></span>{asset.downloadUrl && <a href={asset.downloadUrl} target="_blank" rel="noreferrer"><ArrowDownToLine size={15}/></a>}</div>) : <button className="upload-zone" onClick={() => fileRef.current?.click()}><CloudUpload size={24}/><b>Upload raw footage</b><small>MP4, MOV, WebM, images or audio</small></button>}</div>
      <div className="drawer-actions"><button className="secondary-btn full" onClick={() => fileRef.current?.click()}><CloudUpload size={16}/> Upload media</button><button className="primary-btn full" disabled={busy || !selected.assets?.some(asset => asset.status === 'uploaded')} onClick={startAI}>{busy ? <LoaderCircle className="spin" size={16}/> : <WandSparkles size={16}/>} Generate with AI</button></div>
      {selected.error?.message && <div className="alert error">{selected.error.message}</div>}
    </aside></div>}

    {showCreate && <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setShowCreate(false)}><form className="create-modal" onSubmit={createProject}><div className="modal-heading"><div><div className="overline">NEW CREATIVE PROJECT</div><h2>What are we creating?</h2><p>Tell the AI Director what you want to make.</p></div><button type="button" className="round-button" onClick={() => setShowCreate(false)}><X size={17}/></button></div>
      <div className="form-grid"><label className="wide">Project name<input name="title" placeholder="e.g. Summer cafe launch film" required maxLength="140"/></label><label>Customer name<input name="customer" placeholder="Customer name" required/></label><label>Email (optional)<input name="email" type="email" placeholder="name@example.com"/></label><label>Video type<select name="format"><option value="reel">Instagram Reel</option><option value="short">YouTube Short</option><option value="youtube">YouTube Video</option><option value="wedding">Wedding Highlight</option><option value="promo">Promotional Film</option><option value="custom">Custom</option></select></label><label>Aspect ratio<select name="aspectRatio"><option value="9:16">9:16 · Vertical</option><option value="16:9">16:9 · Landscape</option><option value="1:1">1:1 · Square</option><option value="4:5">4:5 · Portrait</option></select></label><label>Target duration (seconds)<input name="duration" type="number" min="5" max="3600" defaultValue="30"/></label><label>Editing style<input name="style" defaultValue="Cinematic, polished, engaging" maxLength="1000"/></label><label className="wide">Creative instructions<textarea name="instructions" rows="3" placeholder="Describe the story, key moments, pacing, captions, brand details..."/></label></div>
      <div className="modal-footer"><span><Sparkles size={14}/> AI will turn this brief into an edit plan.</span><button className="primary-btn" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16}/> : <Plus size={16}/>} Create project</button></div>
    </form></div>}
  </div>;
}

function Stat({ icon: Icon, label, value, note }) { return <div className="stat-card"><div className="stat-icon"><Icon size={17}/></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><small>{note}</small></div>; }
export default App;
