import { useState } from 'react';
import { Track } from '../types';
import {
  streamProxy,
  getVideoId,
  tryInvidiousDownload,
  tryPipedDownload,
  tryServerDownload,
  pollServerFallback,
} from '../api';

export function useDownload() {
  const [downloading, setDownloading] = useState(false);
  const [fullAudioUri, setFullAudioUri] = useState<string | null>(null);

  function revokeAudio() {
    if (fullAudioUri && fullAudioUri.startsWith('blob:')) {
      URL.revokeObjectURL(fullAudioUri);
    }
    setFullAudioUri(null);
  }

  function reset() {
    revokeAudio();
    setDownloading(false);
  }

  async function downloadFull(track: Track, onHistorySave?: () => void) {
    setDownloading(true);
    try {
      onHistorySave?.();

      const serverPromise = tryServerDownload(track.id);
      const streamProxyPromise = streamProxy(track.id);

      const serverUrl = await serverPromise;
      if (serverUrl) { setFullAudioUri(serverUrl); return; }

      const streamUrl = await streamProxyPromise;
      if (streamUrl) { setFullAudioUri(streamUrl); return; }

      // Client-side fallback: Invidious → Piped
      const videoId = await getVideoId(track.id);
      if (videoId) {
        const invUrl = await tryInvidiousDownload(videoId);
        if (invUrl) { setFullAudioUri(invUrl); return; }

        const pipedUrl = await tryPipedDownload(videoId);
        if (pipedUrl) { setFullAudioUri(pipedUrl); return; }
      }

      // Last resort: poll server
      const pollUrl = await pollServerFallback(track.id);
      if (pollUrl) { setFullAudioUri(pollUrl); return; }

      throw new Error('No se pudo descargar');
    } catch {
      alert('Error descargando canción completa. Intenta con otra canción.');
    } finally {
      setDownloading(false);
    }
  }

  return { downloading, fullAudioUri, downloadFull, reset };
}
