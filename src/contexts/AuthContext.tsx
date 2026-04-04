import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'ADMIN' | 'USER';
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<void>;
  logout: () => void;
}

// ─── Token helpers ──────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = 'ps_access_token';
const REFRESH_TOKEN_KEY = 'ps_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Decode a JWT payload without verification (for reading expiry).
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // ── Refresh scheduling ────────────────────────────────────────────────

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (accessToken: string) => {
      clearRefreshTimer();

      const payload = decodeJwtPayload(accessToken);
      if (!payload || typeof payload.exp !== 'number') return;

      // Refresh 60 seconds before expiry, minimum 10 seconds from now
      const expiresInMs = payload.exp * 1000 - Date.now();
      const refreshInMs = Math.max(expiresInMs - 60_000, 10_000);

      refreshTimerRef.current = setTimeout(async () => {
        const rt = getRefreshToken();
        if (!rt) return;

        try {
          const data = await api.auth.refresh(rt);
          setTokens(data.accessToken, data.refreshToken);
          scheduleRefresh(data.accessToken);
        } catch {
          // Refresh failed -- force logout
          clearTokens();
          setUser(null);
          navigate('/login', { replace: true });
        }
      }, refreshInMs);
    },
    [clearRefreshTimer, navigate],
  );

  // ── Bootstrap: validate existing session on mount ─────────────────────

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.auth.me();
        if (!cancelled) {
          setUser(data.user);
          scheduleRefresh(token);
        }
      } catch {
        // Token invalid -- clear
        clearTokens();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      clearRefreshTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.auth.login(email, password);
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      scheduleRefresh(data.accessToken);
    },
    [scheduleRefresh],
  );

  // ── Register ──────────────────────────────────────────────────────────

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string,
    ) => {
      const data = await api.auth.register(email, password, firstName, lastName);
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      scheduleRefresh(data.accessToken);
    },
    [scheduleRefresh],
  );

  // ── Logout ────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    const rt = getRefreshToken();
    // Fire-and-forget the server-side logout
    if (rt) {
      api.auth.logout(rt).catch(() => {});
    }
    clearTokens();
    clearRefreshTimer();
    setUser(null);
    navigate('/login', { replace: true });
  }, [clearRefreshTimer, navigate]);

  // ── Value ─────────────────────────────────────────────────────────────

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
