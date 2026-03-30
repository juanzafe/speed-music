import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://speed-music-backend.onrender.com';

export interface SpotifyAuth {
  accessToken: string | null;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

export function useSpotifyAuth(): SpotifyAuth {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenStr, setRefreshTokenStr] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);

  // Read tokens from URL hash after OAuth redirect (web only)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const refresh = params.get('refresh_token');
    const expiresIn = params.get('expires_in');

    if (token) {
      setAccessToken(token);
      if (refresh) setRefreshTokenStr(refresh);
      if (expiresIn) setExpiresAt(Date.now() + Number(expiresIn) * 1000);
      // Clean the URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!accessToken || !refreshTokenStr || !expiresAt) return;

    const msUntilRefresh = expiresAt - Date.now() - 60_000;
    if (msUntilRefresh <= 0) {
      doRefresh();
      return;
    }

    const timer = setTimeout(doRefresh, msUntilRefresh);
    return () => clearTimeout(timer);
  }, [accessToken, expiresAt, refreshTokenStr]);

  async function doRefresh() {
    if (!refreshTokenStr) return;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshTokenStr }),
      });
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        if (data.refresh_token) setRefreshTokenStr(data.refresh_token);
        if (data.expires_in) setExpiresAt(Date.now() + data.expires_in * 1000);
      }
    } catch {
      setAccessToken(null);
      setRefreshTokenStr(null);
    }
  }

  const login = useCallback(() => {
    if (Platform.OS === 'web') {
      window.location.href = `${API_BASE}/auth/login`;
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshTokenStr(null);
    setExpiresAt(0);
  }, []);

  return { accessToken, isLoggedIn: !!accessToken, login, logout };
}
