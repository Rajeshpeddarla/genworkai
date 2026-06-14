// GenWorkAI Content Script — guard against double-injection
if (!(window as any).__genworkai_init) {
  (window as any).__genworkai_init = true;

  const SIDEBAR_ID = '__genworkai_root__';
  const WIDTH = 380;

  const getSidebar = () => document.getElementById(SIDEBAR_ID) as HTMLDivElement | null;

  function openSidebar() {
    if (getSidebar()) return; // already open

    const container = document.createElement('div');
    container.id = SIDEBAR_ID;
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: WIDTH + 'px',
      height: '100%',
      zIndex: '2147483647',
      transform: `translateX(${WIDTH}px)`,
      transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: '-6px 0 30px rgba(0,0,0,0.5)',
      borderLeft: '1px solid rgba(255,255,255,0.07)',
      overflow: 'hidden',
    });

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('index.html');
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      display: 'block',
    });

    container.appendChild(iframe);
    document.documentElement.appendChild(container);

    // Animate in
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = getSidebar();
      if (el) el.style.transform = 'translateX(0)';
    }));
  }

  function closeSidebar() {
    const el = getSidebar();
    if (!el) return;
    el.style.transform = `translateX(${WIDTH}px)`;
    setTimeout(() => el.remove(), 300);
  }

  function toggleSidebar() {
    if (getSidebar()) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  // From background script (toolbar icon click)
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'toggle_sidebar') {
      toggleSidebar();
      sendResponse({ ok: true }); // MUST respond to avoid MV3 promise rejection
    }
    if (msg.action === 'extract_content') {
      try {
        const m = msg.mode || 'auto';
        let markdown = '';
        let articleData: any = null;

        if (m === 'auto') {
          const el = document.querySelector('article, main, [role="main"]') || document.body;
          markdown = (el as HTMLElement).innerText || '';
        } else {
          markdown = document.body.innerText || document.body.textContent || '';
        }
        articleData = { title: document.title, excerpt: markdown.substring(0, 150) };

        const images = Array.from(document.querySelectorAll('img'))
          .map(i => i.src).filter(s => s.startsWith('http')).slice(0, 20);

        sendResponse({ success: true, data: { images, videos: [], article: articleData, markdown } });
      } catch (e) {
        sendResponse({ success: false, error: (e as Error).message });
      }
      return true;
    }
  });

  // Close from iframe X button via postMessage
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'GENWORKAI_CLOSE') closeSidebar();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });
}
