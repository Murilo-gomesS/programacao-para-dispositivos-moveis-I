import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../services/api';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { nome: string; perfil: string; matricula?: string; alunoId?: number; professorId?: number } | null;
  login: (
    token: string,
    user: { nome: string; perfil: string; matricula?: string; alunoId?: number; professorId?: number },
  ) => Promise<void>;
  updateUser: (user: { nome: string; perfil: string; matricula?: string; alunoId?: number; professorId?: number }) => Promise<void>;
  adminDataRevision: number;
  bumpAdminDataRevision: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminDataRevision, setAdminDataRevision] = useState(0);
  const [user, setUser] = useState<
    { nome: string; perfil: string; matricula?: string; alunoId?: number; professorId?: number } | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const storedUser = await SecureStore.getItemAsync('auth_user');
        if (isMounted && token) {
          setAuthToken(token);
          setIsAuthenticated(true);

          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              setUser(null);
            }
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (
      token: string,
      nextUser: { nome: string; perfil: string; matricula?: string; alunoId?: number; professorId?: number },
    ) => {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(nextUser));
    setAuthToken(token);
    setIsAuthenticated(true);
    setUser(nextUser);
    },
    [],
  );

  const updateUser = useCallback(
    async (nextUser: { nome: string; perfil: string; matricula?: string; alunoId?: number; professorId?: number }) => {
      await SecureStore.setItemAsync('auth_user', JSON.stringify(nextUser));
      setUser(nextUser);
    },
    [],
  );

  const bumpAdminDataRevision = useCallback(() => {
    setAdminDataRevision((current) => current + 1);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    setAuthToken();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      login,
      updateUser,
      adminDataRevision,
      bumpAdminDataRevision,
      logout,
    }),
    [isAuthenticated, isLoading, user, login, updateUser, adminDataRevision, bumpAdminDataRevision, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
