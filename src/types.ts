export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string | null;
  previewUrl: string | null;
  durationMs: number;
}
