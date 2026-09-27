/**
 * YT Tools - Main Router & Application Controller
 * Pure Vanilla JS - Standalone YouTube Creator Suite
 */

const App = {
  activeToolId: null,
  activeCategory: 'all',

  tools: [
    {
      id: 'yt-down',
      category: 'downloader',
      title: 'YouTube Video & Audio Downloader',
      desc: 'Download MP4 videos (1080p, 720p, 480p) & MP3 audio (320kbps, 256kbps) directly to your device.',
      badge: 'High Speed',
      render: (c) => YouTubeTools.renderVideoDownloader(c)
    },
    {
      id: 'yt-thumb',
      category: 'thumbnail',
      title: 'YouTube Thumbnail Grabber',
      desc: 'Extract 1080p Full HD, 720p HD, and 480p cover images instantly from any YouTube Video or Shorts.',
      badge: 'Full HD',
      render: (c) => YouTubeTools.renderThumbnailGrabber(c)
    },
    {
      id: 'yt-tags',
      category: 'seo',
      title: 'YouTube Tags & SEO Extractor',
      desc: 'Extract hidden video tags, keywords, and metadata to boost your YouTube search ranking.',
      badge: 'SEO Tool',
      render: (c) => YouTubeTools.renderTagsExtractor(c)
    },
    {
      id: 'yt-meta',
      category: 'metadata',
      title: 'Video Title & Description Inspector',
      desc: 'View and copy raw video title, view counts, published dates, and full descriptions in one click.',
      badge: 'Metadata',
      render: (c) => YouTubeTools.renderMetadataExtractor(c)
    },
    {
      id: 'yt-channel',
      category: 'metadata',
      title: 'YouTube Channel ID & Profile Grabber',
      desc: 'Extract channel ID, custom handle, subscriber counts, and high-resolution channel avatars.',
      badge: 'Channel',
      render: (c) => YouTubeTools.renderChannelGrabber(c)
    }
  ],

  icons: {
    'yt-down': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    'yt-thumb': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    'yt-tags': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    'yt-meta': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    'yt-channel': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  },

  svg(name) {
    return this.icons[name] || '';
  },

  init() {
    this.initTheme();
    this.renderToolGrid();
    this.initSearch();
    this.handleInitialRoute();

    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  },

  initTheme() {
    const savedTheme = localStorage.getItem('yt_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', current);
    localStorage.setItem('yt_theme', current);
  },

  filterCategory(cat, btnEl) {
    this.activeCategory = cat;
    document.querySelectorAll('.yt-cat-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    if (cat === 'all') {
      this.renderToolGrid(this.tools);
    } else {
      const filtered = this.tools.filter(t => t.category === cat);
      this.renderToolGrid(filtered);
    }
  },

  renderToolGrid(filterList = null) {
    const grid = document.getElementById('yt-tools-grid');
    if (!grid) return;

    const list = filterList || (this.activeCategory === 'all' ? this.tools : this.tools.filter(t => t.category === this.activeCategory));
    
    if (list.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">No matching tools found.</div>`;
      return;
    }

    grid.innerHTML = list.map(t => `
      <div class="yt-tool-card" onclick="App.openTool('${t.id}')">
        <div>
          <div class="yt-card-header">
            <div class="yt-card-icon">${this.svg(t.id)}</div>
            <span class="yt-card-badge">${t.badge}</span>
          </div>
          <h3 class="yt-card-title">${t.title}</h3>
          <p class="yt-card-desc">${t.desc}</p>
        </div>
        <div class="yt-card-footer">
          <span>Open Tool</span>
          <div class="yt-card-arrow">&rarr;</div>
        </div>
      </div>
    `).join('');
  },

  initSearch() {
    const input = document.getElementById('yt-hero-search');
    if (!input) return;
    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        this.renderToolGrid();
        return;
      }
      const filtered = this.tools.filter(t => t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
      this.renderToolGrid(filtered);
    });
  },

  openTool(id, updateHistory = true) {
    const tool = this.tools.find(t => t.id === id);
    if (!tool) return;

    this.activeToolId = id;
    document.title = `${tool.title} — YT Tools Suite`;

    if (window.location.protocol.startsWith('http') && updateHistory) {
      try { history.pushState({ toolId: id }, '', `?tool=${id}`); } catch (_) {}
    }

    document.getElementById('yt-portal-view').style.display = 'none';
    const ws = document.getElementById('yt-workspace-view');
    ws.style.display = 'block';

    document.getElementById('ws-icon').innerHTML = this.svg(tool.id);
    document.getElementById('ws-title').textContent = tool.title;
    document.getElementById('ws-desc').textContent = tool.desc;

    const container = document.getElementById('yt-tool-container');
    container.innerHTML = '';
    tool.render(container);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  closeTool(skipScroll = false, updateHistory = true) {
    this.activeToolId = null;
    document.title = 'YT Tools — Free & Private YouTube Downloader & Creator Suite';

    if (window.location.protocol.startsWith('http') && updateHistory) {
      try { history.pushState(null, '', window.location.pathname); } catch (_) {}
    }

    document.getElementById('yt-workspace-view').style.display = 'none';
    document.getElementById('yt-portal-view').style.display = 'block';
    if (!skipScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  handleInitialRoute() {
    window.addEventListener('popstate', (e) => {
      const stateTool = e.state && e.state.toolId;
      if (stateTool) {
        this.openTool(stateTool, false);
      } else {
        const params = new URLSearchParams(window.location.search);
        const tool = params.get('tool');
        if (tool && this.tools.some(t => t.id === tool)) {
          this.openTool(tool, false);
        } else {
          this.closeTool(true, false);
        }
      }
    });

    const params = new URLSearchParams(window.location.search);
    const toolParam = params.get('tool');
    if (toolParam && this.tools.some(t => t.id === toolParam)) {
      this.openTool(toolParam, false);
    }
  },

  showToast(message, type = 'info') {
    let container = document.getElementById('yt-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'yt-toast-container';
      container.className = 'yt-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `yt-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
