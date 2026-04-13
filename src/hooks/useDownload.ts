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
  const [loadedFromDisk, setLoadedFromDisk] = useState(false);

  function revokeAudio() {
    if (fullAudioUri && fullAudioUri.startsWith('blob:')) {
      URL.revokeObjectURL(fullAudioUri);
    }
    setFullAudioUri(null);
    setLoadedFromDisk(false);
  }

  function reset() {
    revokeAudio();
    setDownloading(false);
  }

  async function downloadFull(
    track: Track,
    opts?: {
      onHistorySave?: () => void;
      isSaved?: boolean;
      loadSavedAudio?: (id: string) => Promise<string | null>;
      saveToDisk?: (track: Track, blobUrl: string) => Promise<void>;
    },
  ) {
    setDownloading(true);
    setLoadedFromDisk(false);
    try {
      opts?.onHistorySave?.();

      // Try loading from disk first
      if (opts?.isSaved && opts?.loadSavedAudio) {
        const savedUrl = await opts.loadSavedAudio(track.id);
        if (savedUrl) {
          setFullAudioUri(savedUrl);
          setLoadedFromDisk(true);
          return;
        }
      }

      const serverPromise = tryServerDownload(track.id);
      const streamProxyPromise = streamProxy(track.id);

      const serverUrl = await serverPromise;
      if (serverUrl) { setFullAudioUri(serverUrl); if (opts?.saveToDisk) await opts.saveToDisk(track, serverUrl); return; }

      const streamUrl = await streamProxyPromise;
      if (streamUrl) { setFullAudioUri(streamUrl); if (opts?.saveToDisk) await opts.saveToDisk(track, streamUrl); return; }

      // Client-side fallback: Invidious → Piped
      const videoId = await getVideoId(track.id);
      if (videoId) {
        const invUrl = await tryInvidiousDownload(videoId);
        if (invUrl) { setFullAudioUri(invUrl); if (opts?.saveToDisk) await opts.saveToDisk(track, invUrl); return; }

        const pipedUrl = await tryPipedDownload(videoId);
        if (pipedUrl) { setFullAudioUri(pipedUrl); if (opts?.saveToDisk) await opts.saveToDisk(track, pipedUrl); return; }
      }

      // Last resort: poll server
      const pollUrl = await pollServerFallback(track.id);
      if (pollUrl) { setFullAudioUri(pollUrl); if (opts?.saveToDisk) await opts.saveToDisk(track, pollUrl); return; }

      throw new Error('No se pudo descargar');
    } catch {
      alert('Error descargando canción completa. Intenta con otra canción.');
    } finally {
      setDownloading(false);
    }
  }

  return { downloading, fullAudioUri, loadedFromDisk, downloadFull, reset };
}
