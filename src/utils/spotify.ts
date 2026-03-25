/**
 * Extrae el track ID de un link de Spotify.
 * Soporta formatos:
 *  - https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6
 *  - https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6?si=xxx
 *  - spotify:track:6rqhFgbbKwnb9MLmUQDhG6
 */
export function getSpotifyTrackId(input: string): string | null {
  // URI format: spotify:track:ID
  const uriMatch = input.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // URL format: open.spotify.com/track/ID
  const urlMatch = input.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  return null;
}