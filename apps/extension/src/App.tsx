import { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';

type ExtractedData = {
  images: string[];
  videos: string[];
  article: any;
  markdown: string;
};

type KB = { id: number; name: string };

const API_BASE = 'http://localhost:3000';

const closeSidebar = () => {
  // Send message to parent page's content script via postMessage
  window.parent.postMessage({ type: 'GENWORKAI_CLOSE' }, '*');
};

// ── Icons (inline SVG) ────────────────────────────────────────────────────────
const IconLayers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);
const IconDatabase = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);
const IconSparkles = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c.5 2.5 2 4 4.5 4.5C14 8 12.5 9.5 12 12c-.5-2.5-2-4-4.5-4.5C9.5 7 11 5.5 12 3z"/><path d="M19 13c.3 1.5 1.2 2.4 2.7 2.7-1.5.3-2.4 1.2-2.7 2.7-.3-1.5-1.2-2.4-2.7-2.7 1.5-.3 2.4-1.2 2.7-2.7z"/><path d="M5 17c.2 1 .8 1.6 1.8 1.8C5.8 19 5.2 19.6 5 20.6c-.2-1-.8-1.6-1.8-1.8C4.2 18.6 4.8 18 5 17z"/>
  </svg>
);
const IconSettings = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconWand = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2m0 14v-2M8 9H2m14 0h-2M13.8 6.2L12 4.4M6.2 13.8 4.4 12m9.4 1.4 1.8 1.8M6.2 10.2 4.4 12"/><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
  </svg>
);
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);
const IconFileText = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8m8 4H8m8 4H8"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root: { position: 'fixed' as const, inset: 0, background: '#13131f', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflowY: 'auto' as const, overflowX: 'hidden' as const, fontSize: 13 },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 14px', background: '#13131f', position: 'sticky' as const, top: 0, zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, boxShadow: '0 0 20px rgba(99,102,241,0.35)' },
  statusDot: (busy: boolean) => ({ width: 7, height: 7, borderRadius: '50%', background: busy ? '#fbbf24' : '#34d399', display: 'inline-block', flexShrink: 0, ...(busy ? { animation: 'pulse 1.5s infinite' } : {}) }),
  iconBtn: { width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#1c1c2e', borderRadius: 16, padding: 16, margin: '0 12px 12px', border: '1px solid rgba(255,255,255,0.05)' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 14 },
  badge: { fontSize: 10, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2px 8px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', marginLeft: 'auto' },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#13131f', color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const },
  select: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#13131f', color: 'rgba(255,255,255,0.5)', fontSize: 12, outline: 'none', appearance: 'none' as const, cursor: 'pointer' },
  btnPrimary: (active: boolean) => ({ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: active ? 'linear-gradient(90deg, #818cf8, #22d3ee)' : '#13131f', color: active ? '#000' : 'rgba(255,255,255,0.35)', border_: active ? 'none' : '1px solid rgba(255,255,255,0.07)', transition: 'all 0.2s' }),
  btnGhost: { width: '100%', padding: '9px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#13131f', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 8 },
  tealBtn: { width: 38, height: 38, borderRadius: 10, border: 'none', background: '#2dd4bf', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 },
};

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [mode, setMode] = useState<'auto' | 'full'>('auto');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<ExtractedData | null>(null);
  const [kbs, setKbs] = useState<KB[]>([]);
  const [selectedKb, setSelectedKb] = useState('');
  const [newKbName, setNewKbName] = useState('');
  const [creatingKb, setCreatingKb] = useState(false);
  const [prompt, setPrompt] = useState('Convert this page into a structured professional document.');

  useEffect(() => { fetchKbs(); extractPage('auto'); }, []);

  const fetchKbs = async () => {
    try { const r = await fetch(`${API_BASE}/api/knowledge/list`); if (r.ok) { const d = await r.json(); setKbs(d.kbs || []); } } catch {}
  };

  const extractPage = async (m: 'auto' | 'full') => {
    setStatus('Scanning page...');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab');
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://')) throw new Error('Cannot extract system pages');
      const res = await chrome.tabs.sendMessage(tab.id, { action: 'extract_content', mode: m }).catch(() => ({ success: false, error: 'Reload the page to connect' })) as any;
      if (!res?.success) throw new Error(res?.error || 'Extraction failed');
      setData(res.data);
      setStatus(`${(res.data.markdown.length || 0).toLocaleString()} chars extracted`);
    } catch (e) { setStatus((e as Error).message); }
  };

  const handleMode = (m: 'auto' | 'full') => { setMode(m); extractPage(m); };

  const createKb = async () => {
    if (!newKbName.trim()) return;
    setCreatingKb(true);
    try {
      const r = await fetch(`${API_BASE}/api/knowledge/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newKbName }) });
      if (r.ok) { await fetchKbs(); setNewKbName(''); setStatus('Knowledge base created!'); }
    } catch {}
    setCreatingKb(false);
  };

  const copyRaw = async () => {
    if (data?.markdown) { await navigator.clipboard.writeText(data.markdown); setStatus('Copied to clipboard!'); }
  };

  const generate = async (format: 'PDF' | 'DOCX') => {
    if (!data?.markdown) return setStatus('No content to generate from');
    if (!selectedKb) return setStatus('Select a knowledge base first');
    setBusy(true); setStatus('Generating with AI...');
    try {
      const aiRes = await fetch(`${API_BASE}/api/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markdown: 'ignored', prompt: `${data.markdown.substring(0, 15000)}\n\n${prompt}`, type: 'professional_pdf' }) });
      const aiData = await aiRes.json();
      if (!aiData.success) throw new Error(aiData.error || 'AI generation failed');
      const md = aiData.data;
      const fileName = `${(data.article?.title || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format.toLowerCase()}`;
      let blob: Blob | null = null;
      setStatus(`Rendering ${format}...`);
      if (format === 'PDF') {
        const container = document.createElement('div');
        container.innerHTML = marked.parse(md) as string;
        container.style.cssText = 'position:fixed;top:0;left:0;width:800px;z-index:-9999;background:white;color:black;padding:40px;';
        document.body.appendChild(container);
        blob = await html2pdf().set({ margin: 0.5, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } }).from(container).output('blob');
        document.body.removeChild(container);
      } else {
        const doc = new Document({ sections: [{ children: md.split('\n').map((l: string) => new Paragraph({ children: [new TextRun(l)] })) }] });
        blob = await Packer.toBlob(doc);
      }
      if (!blob) throw new Error('Failed to create file');
      setStatus('Uploading...');
      const form = new FormData(); form.append('file', blob, fileName); form.append('kbId', selectedKb);
      const up = await fetch(`${API_BASE}/api/knowledge/upload`, { method: 'POST', body: form });
      if (!up.ok) throw new Error('Upload failed');
      setStatus(`✓ ${format} saved to knowledge base!`);
    } catch (e) { setStatus(`Error: ${(e as Error).message}`); }
    setBusy(false);
  };

  return (
    <div style={S.root}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        select option { background: #1c1c2e; color: #fff; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div style={S.avatar}>✦</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.01em' }}>GenWorkAI</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <span style={S.statusDot(busy)} />
            <span style={{ fontSize: 10, color: busy ? '#fbbf24' : 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{status || 'Ready'}</span>
          </div>
        </div>
        <button style={S.iconBtn}><IconSettings /></button>
        <button onClick={closeSidebar} style={{ ...S.iconBtn, color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >✕</button>
      </div>

      <div style={{ padding: '12px 0 16px' }}>

        {/* ── Source Extraction ───────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}><IconLayers /></span>
            Source Extraction
            <span style={S.badge}>{(data?.markdown.length || 0).toLocaleString()} chars</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={() => handleMode('auto')} style={{ ...S.btnPrimary(mode === 'auto'), flex: 1, border: mode === 'auto' ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>
              <IconWand /> Auto Clean
            </button>
            <button onClick={() => handleMode('full')} style={{ ...S.btnPrimary(mode === 'full'), flex: 1, border: mode === 'full' ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>
              <IconCopy /> Copy Full Text
            </button>
          </div>
          <button onClick={copyRaw} style={S.btnGhost}>
            <IconCopy /> Copy Raw Extraction
          </button>
        </div>

        {/* ── Knowledge Base ──────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}><IconDatabase /></span>
            Knowledge Base
          </div>
          <span style={S.label}>Target</span>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <select value={selectedKb} onChange={e => setSelectedKb(e.target.value)} style={{ ...S.select, color: selectedKb ? '#fff' : 'rgba(255,255,255,0.25)' }}>
              <option value="" disabled>Select knowledge base...</option>
              {kbs.map(kb => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
            </select>
          </div>
          <span style={S.label}>Create new</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={newKbName} onChange={e => setNewKbName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createKb()} placeholder="e.g. Research Notes" style={S.input} />
            <button onClick={createKb} disabled={creatingKb || !newKbName.trim()} style={{ ...S.tealBtn, opacity: creatingKb || !newKbName.trim() ? 0.4 : 1 }}>
              <IconPlus />
            </button>
          </div>
        </div>

        {/* ── AI Generation ───────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <span style={{ color: '#fbbf24' }}><IconSparkles /></span>
            AI Generation Prompt
          </div>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} style={{ ...S.input, resize: 'none', lineHeight: 1.6, marginBottom: 14, color: 'rgba(255,255,255,0.75)', minHeight: 72 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => generate('PDF')} disabled={busy || !selectedKb} style={{ padding: '12px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: busy || !selectedKb ? 'rgba(252,165,165,0.3)' : '#fca5a5', fontSize: 11, fontWeight: 600, cursor: busy || !selectedKb ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ color: busy || !selectedKb ? 'rgba(248,113,113,0.3)' : '#f87171' }}><IconFileText /></span> Generate PDF
            </button>
            <button onClick={() => generate('DOCX')} disabled={busy || !selectedKb} style={{ padding: '12px 0', borderRadius: 12, border: '1px solid rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.08)', color: busy || !selectedKb ? 'rgba(103,232,249,0.3)' : '#67e8f9', fontSize: 11, fontWeight: 600, cursor: busy || !selectedKb ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ color: busy || !selectedKb ? 'rgba(34,211,238,0.3)' : '#22d3ee' }}><IconFileText /></span> Generate DOCX
            </button>
          </div>
          {!selectedKb && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: 'rgba(248,113,113,0.7)' }}>Select a Knowledge Base first</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
