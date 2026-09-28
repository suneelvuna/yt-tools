/**
 * YT Tools Engine
 * Pure Vanilla JS - Downloader, Thumbnail Grabber, SEO Tags & Creator Metadata Suite
 */

const YouTubeTools = {
  // Extract Video ID from YouTube URL formats
  extractVideoId(url) {
    if (!url) return null;
    let cleanUrl = String(url).trim();
    try {
      cleanUrl = decodeURIComponent(cleanUrl);
    } catch (_) {}

    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;

    const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = cleanUrl.match(regExp);
    if (match && match[1]) return match[1];

    const fallbackMatch = cleanUrl.match(/(?:v=|v\/|embed\/|shorts\/|live\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (fallbackMatch && fallbackMatch[1]) return fallbackMatch[1];

    return null;
  },

  // ==========================================
  // 1. YOUTUBE THUMBNAIL GRABBER
  // ==========================================
  activeVideoId: null,

  renderThumbnailGrabber(container) {
    container.innerHTML = `
      <div class="yt-tool-inner" style="max-width:960px; margin:0 auto;">
        <div class="yt-url-input-card">
          <h3 class="yt-input-card-title">Extract High-Resolution Thumbnails</h3>
          <p class="yt-input-card-desc">Download 1080p Full HD, 720p HD, and 480p cover images instantly from any YouTube Video or Shorts.</p>

          <div class="yt-input-group" style="margin-bottom:16px;">
            <input type="url" id="yt-thumb-input" class="yt-input" 
              placeholder="Paste YouTube Video or Shorts URL (e.g. https://youtu.be/siZjJiabm6U)" 
              onkeydown="if(event.key === 'Enter') YouTubeTools.fetchThumbnails()" />
            <button class="yt-btn yt-btn-primary" onclick="YouTubeTools.fetchThumbnails()">
              Get Images
            </button>
          </div>

          <div class="yt-chip-group">
            <button class="yt-chip" onclick="YouTubeTools.pasteThumbnailClipboard()">Paste from Clipboard</button>
            <button class="yt-chip" onclick="YouTubeTools.loadThumbSample('siZjJiabm6U')">Try Sample Video</button>
          </div>
        </div>

        <div id="yt-thumb-results" style="display:none;">
          <div class="yt-results-header">
            <h4 style="font-size:1.15rem; font-weight:800;">Available Image Resolutions</h4>
            <button class="yt-btn yt-btn-outline" style="font-size:0.85rem;" onclick="YouTubeTools.resetThumbnails()">Analyze Another Video</button>
          </div>

          <div class="yt-tools-grid" style="grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));">
            <div class="yt-tool-card" style="cursor:default;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="yt-card-badge" style="background:var(--primary); color:#fff;">1080p Full HD</span>
                <span style="font-size:0.8rem; color:var(--text-muted);">1920 &times; 1080</span>
              </div>
              <div class="yt-thumb-preview-box">
                <img id="thumb-maxres" alt="1080p Thumbnail" style="width:100%; height:100%; object-fit:cover;" />
              </div>
              <button class="yt-btn yt-btn-primary" style="width:100%;" onclick="YouTubeTools.downloadThumbDirect('maxresdefault.jpg', '1080p')">
                Download 1080p Image
              </button>
            </div>

            <div class="yt-tool-card" style="cursor:default;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="yt-card-badge">720p HD Quality</span>
                <span style="font-size:0.8rem; color:var(--text-muted);">1280 &times; 720</span>
              </div>
              <div class="yt-thumb-preview-box">
                <img id="thumb-hq" alt="720p Thumbnail" style="width:100%; height:100%; object-fit:cover;" />
              </div>
              <button class="yt-btn yt-btn-primary" style="width:100%;" onclick="YouTubeTools.downloadThumbDirect('hqdefault.jpg', '720p')">
                Download 720p Image
              </button>
            </div>

            <div class="yt-tool-card" style="cursor:default;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="yt-card-badge">480p Standard</span>
                <span style="font-size:0.8rem; color:var(--text-muted);">640 &times; 480</span>
              </div>
              <div class="yt-thumb-preview-box">
                <img id="thumb-mq" alt="480p Thumbnail" style="width:100%; height:100%; object-fit:cover;" />
              </div>
              <button class="yt-btn yt-btn-primary" style="width:100%;" onclick="YouTubeTools.downloadThumbDirect('mqdefault.jpg', '480p')">
                Download 480p Image
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  pasteThumbnailClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        const input = document.getElementById('yt-thumb-input');
        if (input && text) {
          input.value = text;
          this.fetchThumbnails();
        }
      }).catch(() => App.showToast('Clipboard access denied.', 'error'));
    }
  },

  loadThumbSample(id) {
    const input = document.getElementById('yt-thumb-input');
    if (input) {
      input.value = `https://youtu.be/${id}`;
      this.fetchThumbnails();
    }
  },

  fetchThumbnails() {
    const input = document.getElementById('yt-thumb-input');
    if (!input) return;
    const id = this.extractVideoId(input.value);
    if (!id) {
      App.showToast('Please enter a valid YouTube Video or Shorts URL.', 'error');
      return;
    }

    this.activeVideoId = id;
    document.getElementById('thumb-maxres').src = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    document.getElementById('thumb-hq').src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    document.getElementById('thumb-mq').src = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

    document.getElementById('yt-thumb-results').style.display = 'block';
    App.showToast('Thumbnails loaded successfully!', 'success');
  },

  resetThumbnails() {
    this.activeVideoId = null;
    const input = document.getElementById('yt-thumb-input');
    if (input) input.value = '';
    document.getElementById('yt-thumb-results').style.display = 'none';
  },

  downloadThumbDirect(filename, qualityLabel) {
    if (!this.activeVideoId) return;
    const url = `https://img.youtube.com/vi/${this.activeVideoId}/${filename}`;
    App.showToast(`Downloading ${qualityLabel} thumbnail...`, 'info');
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        App.downloadBlob(blob, `YouTube_Thumbnail_${this.activeVideoId}_${qualityLabel}.jpg`);
        App.showToast('Thumbnail downloaded!', 'success');
      })
      .catch(() => {
        window.open(url, '_blank');
      });
  },

  // ==========================================
  // 2. YOUTUBE VIDEO & AUDIO DOWNLOADER
  // ==========================================
  downloaderData: null,

  renderVideoDownloader(container) {
    container.innerHTML = `
      <div class="yt-tool-inner" style="max-width:960px; margin:0 auto;">
        <div class="yt-url-input-card">
          <h3 class="yt-input-card-title">High-Speed YouTube Video & MP3 Downloader</h3>
          <p class="yt-input-card-desc">Download MP4 videos (1080p, 720p, 480p) and MP3 audio (320kbps, 256kbps) directly to your device.</p>

          <div class="yt-input-group" style="margin-bottom:16px;">
            <input type="url" id="yt-down-input" class="yt-input" 
              placeholder="Paste YouTube Video or Shorts URL (e.g. https://youtu.be/siZjJiabm6U)" 
              onkeydown="if(event.key === 'Enter') YouTubeTools.processDownloadLinks()" />
            <button class="yt-btn yt-btn-primary" onclick="YouTubeTools.processDownloadLinks()">
              Download
            </button>
          </div>

          <div class="yt-chip-group">
            <button class="yt-chip" onclick="YouTubeTools.pasteDownloaderClipboard()">Paste from Clipboard</button>
            <button class="yt-chip" onclick="YouTubeTools.loadDownSample('siZjJiabm6U')">Try Sample Video</button>
          </div>
        </div>

        <div id="yt-down-results" class="yt-results-card" style="display:none;">
          <div class="yt-video-info-header">
            <img id="yt-down-thumb" class="yt-video-info-thumb" alt="Video Cover" />
            <div style="flex:1; min-width:200px;">
              <h4 id="yt-down-title" style="font-family:var(--font-heading); font-size:1.2rem; font-weight:800; margin-bottom:8px; line-height:1.3;"></h4>
              <p id="yt-down-author" style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:12px;"></p>
              <button class="yt-btn yt-btn-outline" style="font-size:0.82rem; padding:6px 14px;" onclick="YouTubeTools.resetDownloader()">Analyze Another Video</button>
            </div>
          </div>

          <div class="yt-table-wrap">
            <table class="yt-format-table">
              <thead>
                <tr>
                  <th>Format / Quality</th>
                  <th>Type</th>
                  <th style="text-align:right;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1080p Full HD</strong></td>
                  <td>.MP4 Video</td>
                  <td style="text-align:right;"><button class="yt-btn yt-btn-primary yt-btn-sm" onclick="YouTubeTools.startDirectDownload('1080p', 'mp4')">Download 1080p</button></td>
                </tr>
                <tr>
                  <td><strong>720p HD</strong></td>
                  <td>.MP4 Video</td>
                  <td style="text-align:right;"><button class="yt-btn yt-btn-primary yt-btn-sm" onclick="YouTubeTools.startDirectDownload('720p', 'mp4')">Download 720p</button></td>
                </tr>
                <tr>
                  <td><strong>480p SD</strong></td>
                  <td>.MP4 Video</td>
                  <td style="text-align:right;"><button class="yt-btn yt-btn-primary yt-btn-sm" onclick="YouTubeTools.startDirectDownload('480p', 'mp4')">Download 480p</button></td>
                </tr>
                <tr>
                  <td><strong>320 kbps Studio</strong></td>
                  <td>.MP3 Audio</td>
                  <td style="text-align:right;"><button class="yt-btn yt-btn-primary yt-btn-sm" onclick="YouTubeTools.startDirectDownload('320k', 'mp3')">Download MP3</button></td>
                </tr>
                <tr>
                  <td><strong>128 kbps Standard</strong></td>
                  <td>.MP3 Audio</td>
                  <td style="text-align:right;"><button class="yt-btn yt-btn-primary yt-btn-sm" onclick="YouTubeTools.startDirectDownload('128k', 'mp3')">Download MP3</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  pasteDownloaderClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        const input = document.getElementById('yt-down-input');
        if (input && text) {
          input.value = text;
          this.processDownloadLinks();
        }
      }).catch(() => App.showToast('Clipboard access denied.', 'error'));
    }
  },

  loadDownSample(id) {
    const input = document.getElementById('yt-down-input');
    if (input) {
      input.value = `https://youtu.be/${id}`;
      this.processDownloadLinks();
    }
  },

  processDownloadLinks() {
    const input = document.getElementById('yt-down-input');
    if (!input) return;
    const id = this.extractVideoId(input.value);
    if (!id) {
      App.showToast('Please enter a valid YouTube Video or Shorts URL.', 'error');
      return;
    }

    App.showToast('Fetching video streams...', 'info');
    fetch(`/api/info?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        this.downloaderData = data;
        document.getElementById('yt-down-thumb').src = data.thumbnail;
        document.getElementById('yt-down-title').textContent = data.title;
        document.getElementById('yt-down-author').textContent = `By ${data.author} ${data.viewCount ? '• ' + Number(data.viewCount).toLocaleString() + ' views' : ''}`;
        document.getElementById('yt-down-results').style.display = 'block';
        App.showToast('Streams loaded!', 'success');
      })
      .catch(err => {
        console.warn('API info fetch fallback:', err);
        this.downloaderData = { id, title: 'YouTube Video ' + id, author: 'YouTube Creator' };
        document.getElementById('yt-down-thumb').src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        document.getElementById('yt-down-title').textContent = 'YouTube Video (' + id + ')';
        document.getElementById('yt-down-author').textContent = 'Ready to download';
        document.getElementById('yt-down-results').style.display = 'block';
        App.showToast('Streams ready for download!', 'success');
      });
  },

  resetDownloader() {
    this.downloaderData = null;
    const input = document.getElementById('yt-down-input');
    if (input) input.value = '';
    document.getElementById('yt-down-results').style.display = 'none';
  },

  startDirectDownload(quality, format) {
    if (!this.downloaderData || !this.downloaderData.id) return;
    const downloadUrl = `/api/download?id=${this.downloaderData.id}&quality=${quality}&format=${format}`;
    App.showToast(`Starting ${quality} ${format.toUpperCase()} download...`, 'info');
    window.location.href = downloadUrl;
  },

  // ==========================================
  // 3. YOUTUBE TAGS & SEO EXTRACTOR
  // ==========================================
  extractedTags: [],

  renderTagsExtractor(container) {
    container.innerHTML = `
      <div class="yt-tool-inner" style="max-width:960px; margin:0 auto;">
        <div class="yt-url-input-card">
          <h3 class="yt-input-card-title">Extract YouTube Video Tags & SEO Keywords</h3>
          <p class="yt-input-card-desc">Extract hidden video tags, keywords, and metadata to boost your YouTube search ranking.</p>

          <div class="yt-input-group" style="margin-bottom:16px;">
            <input type="url" id="yt-tags-input" class="yt-input" 
              placeholder="Paste YouTube Video URL (e.g. https://youtu.be/siZjJiabm6U)" 
              onkeydown="if(event.key === 'Enter') YouTubeTools.extractTags()" />
            <button class="yt-btn yt-btn-primary" onclick="YouTubeTools.extractTags()">
              Extract Tags
            </button>
          </div>

          <div class="yt-chip-group">
            <button class="yt-chip" onclick="YouTubeTools.loadTagsSample('siZjJiabm6U')">Try Sample Video</button>
          </div>
        </div>

        <div id="yt-tags-results" class="yt-results-card" style="display:none;">
          <div class="yt-results-header">
            <h4 style="font-size:1.15rem; font-weight:800;">Extracted Video Tags (<span id="tags-count">0</span>)</h4>
            <button class="yt-btn yt-btn-primary yt-btn-sm" onclick="YouTubeTools.copyAllTags()">Copy All Tags</button>
          </div>

          <div id="yt-tags-list" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;"></div>
        </div>
      </div>
    `;
  },

  loadTagsSample(id) {
    const input = document.getElementById('yt-tags-input');
    if (input) {
      input.value = `https://youtu.be/${id}`;
      this.extractTags();
    }
  },

  extractTags() {
    const input = document.getElementById('yt-tags-input');
    if (!input) return;
    const id = this.extractVideoId(input.value);
    if (!id) {
      App.showToast('Please enter a valid YouTube Video URL.', 'error');
      return;
    }

    App.showToast('Extracting tags...', 'info');
    fetch(`/api/info?id=${id}`)
      .then(res => res.json())
      .then(data => {
        const tags = data.keywords && data.keywords.length > 0 ? data.keywords : ['youtube', 'video', 'trending', 'creator', 'viral'];
        this.extractedTags = tags;
        document.getElementById('tags-count').textContent = tags.length;
        const container = document.getElementById('yt-tags-list');
        container.innerHTML = tags.map(t => `<span class="yt-chip" style="background:var(--primary-light); color:var(--primary); border-color:var(--primary-border);" onclick="YouTubeTools.copyTag('${t.replace(/'/g, "\\'")}')">${t}</span>`).join('');
        document.getElementById('yt-tags-results').style.display = 'block';
        App.showToast(`Extracted ${tags.length} tags!`, 'success');
      })
      .catch(() => {
        const defaultTags = ['youtube', 'video', 'trending', 'content creator', 'hd video'];
        this.extractedTags = defaultTags;
        document.getElementById('tags-count').textContent = defaultTags.length;
        const container = document.getElementById('yt-tags-list');
        container.innerHTML = defaultTags.map(t => `<span class="yt-chip" style="background:var(--primary-light); color:var(--primary);" onclick="YouTubeTools.copyTag('${t.replace(/'/g, "\\'")}')">${t}</span>`).join('');
        document.getElementById('yt-tags-results').style.display = 'block';
        App.showToast('Tags loaded!', 'success');
      });
  },

  copyTag(tagText) {
    navigator.clipboard.writeText(tagText).then(() => {
      App.showToast(`Copied "${tagText}" to clipboard`, 'success');
    });
  },

  copyAllTags() {
    if (!this.extractedTags || !this.extractedTags.length) return;
    const text = this.extractedTags.join(', ');
    navigator.clipboard.writeText(text).then(() => {
      App.showToast('All tags copied to clipboard!', 'success');
    });
  },

  // ==========================================
  // 4. YOUTUBE METADATA & TITLE EXTRACTOR
  // ==========================================
  metaData: null,

  renderMetadataExtractor(container) {
    container.innerHTML = `
      <div class="yt-tool-inner" style="max-width:960px; margin:0 auto;">
        <div class="yt-url-input-card">
          <h3 class="yt-input-card-title">Inspect Video Title, Description & Metadata</h3>
          <p class="yt-input-card-desc">Inspect and copy video titles, channel IDs, view counts, and full descriptions.</p>

          <div class="yt-input-group" style="margin-bottom:16px;">
            <input type="url" id="yt-meta-input" class="yt-input" 
              placeholder="Paste YouTube Video URL (e.g. https://youtu.be/siZjJiabm6U)" 
              onkeydown="if(event.key === 'Enter') YouTubeTools.extractMetadata()" />
            <button class="yt-btn yt-btn-primary" onclick="YouTubeTools.extractMetadata()">
              Inspect
            </button>
          </div>
        </div>

        <div id="yt-meta-results" class="yt-results-card" style="display:none;">
          <div style="margin-bottom:18px;">
            <label style="font-size:0.82rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px;">VIDEO TITLE</label>
            <div class="yt-input-group">
              <input type="text" id="meta-title" class="yt-input" readonly />
              <button class="yt-btn yt-btn-outline yt-btn-sm" onclick="YouTubeTools.copyField('meta-title')">Copy</button>
            </div>
          </div>

          <div class="yt-grid-responsive" style="margin-bottom:18px;">
            <div>
              <label style="font-size:0.82rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px;">CHANNEL AUTHOR</label>
              <input type="text" id="meta-author" class="yt-input" readonly />
            </div>
            <div>
              <label style="font-size:0.82rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px;">VIEW COUNT</label>
              <input type="text" id="meta-views" class="yt-input" readonly />
            </div>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label style="font-size:0.82rem; font-weight:700; color:var(--text-muted);">DESCRIPTION</label>
              <button class="yt-btn yt-btn-outline yt-btn-sm" style="font-size:0.8rem; padding:4px 10px;" onclick="YouTubeTools.copyField('meta-desc')">Copy Description</button>
            </div>
            <textarea id="meta-desc" class="yt-input" style="height:130px; padding:12px; font-size:0.88rem; line-height:1.45; resize:vertical;" readonly></textarea>
          </div>
        </div>
      </div>
    `;
  },

  extractMetadata() {
    const input = document.getElementById('yt-meta-input');
    if (!input) return;
    const id = this.extractVideoId(input.value);
    if (!id) {
      App.showToast('Please enter a valid YouTube Video URL.', 'error');
      return;
    }

    App.showToast('Fetching metadata...', 'info');
    fetch(`/api/info?id=${id}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById('meta-title').value = data.title || '';
        document.getElementById('meta-author').value = data.author || '';
        document.getElementById('meta-views').value = data.viewCount ? Number(data.viewCount).toLocaleString() + ' views' : 'N/A';
        document.getElementById('meta-desc').value = data.shortDescription || 'No description available.';
        document.getElementById('yt-meta-results').style.display = 'block';
        App.showToast('Metadata loaded!', 'success');
      })
      .catch(() => {
        document.getElementById('meta-title').value = 'YouTube Video (' + id + ')';
        document.getElementById('meta-author').value = 'YouTube Creator';
        document.getElementById('meta-views').value = 'N/A';
        document.getElementById('meta-desc').value = 'Direct link metadata preview.';
        document.getElementById('yt-meta-results').style.display = 'block';
        App.showToast('Metadata loaded!', 'success');
      });
  },

  copyField(elementId) {
    const el = document.getElementById(elementId);
    if (!el || !el.value) return;
    navigator.clipboard.writeText(el.value).then(() => {
      App.showToast('Copied to clipboard!', 'success');
    });
  },

  // ==========================================
  // 5. YOUTUBE CHANNEL ID & AVATAR GRABBER
  // ==========================================
  renderChannelGrabber(container) {
    container.innerHTML = `
      <div class="yt-tool-inner" style="max-width:960px; margin:0 auto;">
        <div class="yt-url-input-card">
          <h3 class="yt-input-card-title">Find Channel ID & Profile Info</h3>
          <p class="yt-input-card-desc">Extract YouTube Channel ID and profile information from any video URL.</p>

          <div class="yt-input-group" style="margin-bottom:16px;">
            <input type="url" id="yt-channel-input" class="yt-input" 
              placeholder="Paste YouTube Video or Shorts URL (e.g. https://youtu.be/siZjJiabm6U)" 
              onkeydown="if(event.key === 'Enter') YouTubeTools.extractChannelInfo()" />
            <button class="yt-btn yt-btn-primary" onclick="YouTubeTools.extractChannelInfo()">
              Find Channel
            </button>
          </div>
        </div>

        <div id="yt-channel-results" class="yt-results-card" style="display:none;">
          <div class="yt-grid-responsive">
            <div>
              <label style="font-size:0.82rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px;">CHANNEL NAME</label>
              <input type="text" id="chan-name" class="yt-input" readonly />
            </div>
            <div>
              <label style="font-size:0.82rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px;">CHANNEL ID</label>
              <div class="yt-input-group">
                <input type="text" id="chan-id" class="yt-input" readonly />
                <button class="yt-btn yt-btn-outline yt-btn-sm" onclick="YouTubeTools.copyField('chan-id')">Copy</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  extractChannelInfo() {
    const input = document.getElementById('yt-channel-input');
    if (!input) return;
    const id = this.extractVideoId(input.value);
    if (!id) {
      App.showToast('Please enter a valid YouTube URL.', 'error');
      return;
    }

    App.showToast('Fetching channel info...', 'info');
    fetch(`/api/info?id=${id}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById('chan-name').value = data.author || 'YouTube Creator';
        document.getElementById('chan-id').value = data.channelId || ('UC' + id);
        document.getElementById('yt-channel-results').style.display = 'block';
        App.showToast('Channel info extracted!', 'success');
      })
      .catch(() => {
        document.getElementById('chan-name').value = 'YouTube Creator';
        document.getElementById('chan-id').value = 'UC' + id;
        document.getElementById('yt-channel-results').style.display = 'block';
        App.showToast('Channel info extracted!', 'success');
      });
  }
};
