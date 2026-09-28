/**
 * YT Tools Hub - Server & YouTube Stream Engine
 * High-Speed YouTube Downloader, Thumbnail & Metadata API
 * Standalone YouTube Creator Suite
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { Innertube, ClientType } = require('youtubei.js');
const YTDLPWrapper = require('yt-dlp-wrap').default;

// Load environment variables
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  try {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[match[1]]) {
          process.env[match[1]] = value.trim();
        }
      }
    });
  } catch (_) {}
}

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = __dirname;

let ytClient = null;
async function getYouTubeClient() {
  if (!ytClient) {
    ytClient = await Innertube.create({ client_type: ClientType.ANDROID });
  }
  return ytClient;
}

const ytDlpPath = path.join(__dirname, os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
let ytDlpClient = null;

async function getYtDlpClient() {
  if (!ytDlpClient) {
    if (!fs.existsSync(ytDlpPath)) {
      try {
        console.log('[INFO] Downloading yt-dlp binary...');
        await YTDLPWrapper.downloadFromGithub(ytDlpPath);
        console.log('[INFO] yt-dlp binary downloaded successfully.');
      } catch (e) {
        console.error('[ERROR] Failed to download yt-dlp binary:', e.message);
      }
    }
    ytDlpClient = new YTDLPWrapper(ytDlpPath);
  }
  return ytDlpClient;
}

function extractVideoId(url) {
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
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 1. API: VIDEO INFO & METADATA
  if (pathname === '/api/info') {
    const rawId = parsedUrl.searchParams.get('id');
    const videoId = extractVideoId(rawId);
    if (!videoId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Valid YouTube Video ID or URL is required' }));
    }

    try {
      const yt = await getYouTubeClient();
      const info = await yt.getBasicInfo(videoId);
      const details = info.basic_info || {};

      const availableFormats = [
        { quality: '1080p', extension: 'mp4', hasAudio: true, label: 'Full HD 1080p' },
        { quality: '720p', extension: 'mp4', hasAudio: true, label: 'HD 720p' },
        { quality: '480p', extension: 'mp4', hasAudio: true, label: 'SD 480p' },
        { quality: '360p', extension: 'mp4', hasAudio: true, label: 'Mobile 360p' },
        { quality: '320k', extension: 'mp3', hasAudio: true, label: 'MP3 Audio (320 kbps)' },
        { quality: '256k', extension: 'mp3', hasAudio: true, label: 'MP3 Audio (256 kbps)' },
        { quality: '128k', extension: 'mp3', hasAudio: true, label: 'MP3 Audio (128 kbps)' },
        { quality: 'm4a', extension: 'm4a', hasAudio: true, label: 'M4A Audio (AAC)' }
      ];

      const responsePayload = {
        id: videoId,
        title: details.title || 'YouTube Video',
        duration: details.duration || 0,
        author: details.author || details.channel?.name || 'YouTube Creator',
        channelId: details.channel_id || '',
        viewCount: details.view_count || 0,
        keywords: details.keywords || [],
        shortDescription: details.short_description || '',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        thumbnails: [
          { quality: '1080p', url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, width: 1920, height: 1080 },
          { quality: '720p', url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, width: 1280, height: 720 },
          { quality: '480p', url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, width: 640, height: 480 },
          { quality: '360p', url: `https://img.youtube.com/vi/${videoId}/default.jpg`, width: 120, height: 90 }
        ],
        formats: availableFormats
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(responsePayload));
    } catch (err) {
      console.error('[API /api/info Error]:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Failed to fetch video information', details: err.message }));
    }
  }

  // 2. API: DIRECT HIGH-SPEED STREAMING DOWNLOAD
  if (pathname === '/api/download') {
    const rawId = parsedUrl.searchParams.get('id');
    const videoId = extractVideoId(rawId);
    const quality = parsedUrl.searchParams.get('quality') || '720p';
    const format = parsedUrl.searchParams.get('format') || 'mp4';

    if (!videoId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Valid YouTube Video ID or URL is required' }));
    }

    try {
      const isAudio = format === 'mp3' || format === 'm4a' || quality.includes('k');
      const height = quality.replace('p', '');
      const formatSpec = isAudio ? 'ba/b' : `bv[height<=${height}]/b`;

      const ytDlp = await getYtDlpClient();
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Bypasses YouTube bot verification and 429 errors on Cloud hosting IPs (Render / AWS / VPS)
      const clientConfigs = [
        'youtube:player_client=tv,mweb,web',
        'youtube:player_client=tv_embedded,mweb',
        'youtube:player_client=mweb,web',
        'youtube:player_client=web'
      ];

      const robustFormatSpec = isAudio 
        ? 'ba/b/18/best' 
        : `b[height<=${height}]/bv[height<=${height}]+ba/b/18/best`;

      let targetUrl = null;
      let lastErr = null;

      for (const clientArg of clientConfigs) {
        try {
          const streamUrlOutput = await ytDlp.execPromise([
            videoUrl,
            '-g',
            '-f', robustFormatSpec,
            '--extractor-args', clientArg,
            '--js-runtimes', 'node',
            '--no-check-certificates'
          ]);

          const resolved = (streamUrlOutput || '').trim().split(/\r?\n/)[0];
          if (resolved && resolved.startsWith('http')) {
            targetUrl = resolved;
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (targetUrl) {
        res.writeHead(302, { Location: targetUrl });
        return res.end();
      } else {
        throw lastErr || new Error('Stream URL resolution returned empty');
      }
    } catch (err) {
      console.error('[API /api/download Error]:', err.message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Download stream failed', details: err.message }));
      } else {
        return res.end();
      }
    }
  }

  // 3. STATIC FILE SERVER WITH GZIP & IMMUTABLE CACHE
  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File Not Found');
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304);
      return res.end();
    }

    const headers = {
      'Content-Type': contentType,
      'ETag': etag
    };

    if (req.url.includes('?v=') || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp' || ext === '.ico') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }

    const compressible = /^(text\/|application\/(javascript|json|xml)|image\/svg\+xml)/.test(contentType);
    const acceptEncoding = req.headers['accept-encoding'] || '';

    if (compressible && acceptEncoding.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      fs.createReadStream(safePath).pipe(zlib.createGzip({ level: 6 })).pipe(res);
    } else if (compressible && acceptEncoding.includes('deflate')) {
      headers['Content-Encoding'] = 'deflate';
      res.writeHead(200, headers);
      fs.createReadStream(safePath).pipe(zlib.createDeflate()).pipe(res);
    } else {
      headers['Content-Length'] = stats.size;
      res.writeHead(200, headers);
      fs.createReadStream(safePath).pipe(res);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[INFO] Port ${PORT} is already active.`);
    process.exit(0);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`YouTube Tools Hub (YT Tools) Live`);
  console.log(`Local URL    : http://localhost:${PORT}`);
  console.log(`Red Brand Theme & High-Speed Creator Suite Active`);
  console.log(`=======================================================`);
});
