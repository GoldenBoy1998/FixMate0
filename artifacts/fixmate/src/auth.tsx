import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type ApiUser, type RegisterInput } from './lib/api';

type AuthContextValue = { user: ApiUser | null; loading: boolean; error: string | null; login: (identity: string, password: string) => Promise<ApiUser>; register: (input: RegisterInput) => Promise<ApiUser>; logout: () => Promise<void>; refresh: () => Promise<ApiUser | null> };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const refresh = async () => { try { const result = await api.currentUser(); setUser(result.user); return result.user; } catch (e) { if ((e as { status?: number }).status === 401) { setUser(null); return null; } setError((e as Error).message); return null; } };
  useEffect(() => { void refresh().finally(() => setLoading(false)); }, []);
  const value = useMemo<AuthContextValue>(() => ({ user, loading, error, login: async (identity, password) => { setError(null); const result = await api.login(identity, password); setUser(result.user); return result.user; }, register: async (input) => { setError(null); const result = await api.register(input); setUser(result.user); return result.user; }, logout: async () => { await api.logout(); setUser(null); }, refresh }), [user, loading, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
