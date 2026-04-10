const RENDER_URL = 'https://speed-music-backend.onrender.com';
const isLocal = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
export const API_BASE = isLocal
  ? (process.env.EXPO_PUBLIC_API_URL ?? RENDER_URL)
  : RENDER_URL;

export function wakeBackend() {
  fetch(API_BASE).catch(() => {});
}

export async function searchTracks(query: string) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Error buscando');
  return res.json();
}

export async function getTrackById(trackId: string) {
  const res = await fetch(`${API_BASE}/song/${trackId}`);
  if (!res.ok) throw new Error('Error obteniendo canción');
  return res.json();
}

export async function streamProxy(trackId: string): Promise<string | null> {
  try {
    const audioRes = await fetch(`${API_BASE}/download/${trackId}/stream`);
    if (!audioRes.ok) return null;
    const blob = await audioRes.blob();
    if (blob.size > 500_000) return URL.createObjectURL(blob);
  } catch {}
  return null;
}

export async function getVideoId(trackId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/download/${trackId}/video-id`);
    if (!res.ok) return null;
    const { videoId } = await res.json();
    return videoId || null;
  } catch {}
  return null;
}

export async function tryInvidiousDownload(videoId: string): Promise<string | null> {
  const instances = [
    'https://inv.thepixora.com',
    'https://invidious.materialio.us',
    'https://yewtu.be',
    'https://inv.tux.pizza',
    'https://invidious.privacyredirect.com',
  ];

  for (const instance of instances) {
    try {
      const url = `${instance}/latest_version?id=${videoId}&itag=140&local=true`;
      const audioRes = await fetch(url, { redirect: 'follow' });
      if (!audioRes.ok) continue;
      const blob = await audioRes.blob();
      if (blob.size > 500_000) return URL.createObjectURL(blob);
    } catch { continue; }
  }
  return null;
}

export async function tryPipedDownload(videoId: string): Promise<string | null> {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.leptons.xyz',
    'https://pipedapi.adminforge.de',
  ];

  for (const instance of instances) {
    try {
      const streamRes = await fetch(`${instance}/streams/${videoId}`);
      if (!streamRes.ok) continue;
      const streamData = await streamRes.json();

      const audioStreams = (streamData.audioStreams || [])
        .filter((s: any) => s.url && s.mimeType?.startsWith('audio/'));
      const mp4Streams = audioStreams
        .filter((s: any) => s.mimeType?.includes('mp4'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      const best = mp4Streams[0] || audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

      if (!best?.url) continue;
      const audioRes = await fetch(best.url);
      if (!audioRes.ok) continue;
      const blob = await audioRes.blob();
      if (blob.size > 500_000) return URL.createObjectURL(blob);
    } catch { continue; }
  }
  return null;
}

export async function tryServerDownload(trackId: string): Promise<string | null> {
  try {
    const prepareRes = await fetch(`${API_BASE}/download/${trackId}/prepare`);
    if (!prepareRes.ok) return null;

    let prepareData;
    try { prepareData = await prepareRes.json(); } catch { return null; }

    let fileSize = 0;
    if (prepareData.status === 'ready') {
      try {
        const statusRes = await fetch(`${API_BASE}/download/${trackId}/status`);
        if (statusRes.ok) fileSize = (await statusRes.json()).size || 0;
      } catch {}
    } else {
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const statusRes = await fetch(`${API_BASE}/download/${trackId}/status`);
          if (!statusRes.ok) continue;
          const d = await statusRes.json();
          if (d.status === 'ready') { fileSize = d.size || 0; break; }
          if (d.status === 'error') return null;
        } catch { continue; }
      }
    }

    if (fileSize > 500_000) {
      const audioRes = await fetch(`${API_BASE}/download/${trackId}`);
      if (audioRes.ok) {
        const blob = await audioRes.blob();
        if (blob.size > 500_000) return URL.createObjectURL(blob);
      }
    }
  } catch {}
  return null;
}

export async function pollServerFallback(trackId: string): Promise<string | null> {
  for (let i = 0; i < 20; i++) {
    try {
      const statusRes = await fetch(`${API_BASE}/download/${trackId}/status`);
      if (statusRes.ok) {
        const d = await statusRes.json();
        if (d.status === 'ready' && d.size > 10_000) {
          const audioRes = await fetch(`${API_BASE}/download/${trackId}`);
          if (audioRes.ok) {
            const blob = await audioRes.blob();
            if (blob.size > 10_000) return URL.createObjectURL(blob);
          }
          break;
        }
        if (d.status === 'error' || d.status === 'none') break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 3000));
  }
  return null;
}
