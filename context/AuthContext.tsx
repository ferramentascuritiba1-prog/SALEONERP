/**
 * Saleon ERP - Contexto de Autenticação & Multiempresa (FC / LA)
 * Login case-insensitive, proteção contra brute-force com rate-limit,
 * alteração obrigatória de senha no primeiro login,
 * e criação de novos usuários com funções personalizadas.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CompanyId, UserSector } from '../types/erp';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  currentCompany: CompanyId;
  allUsers: User[];
  switchCompany: (company: CompanyId) => void;
  switchUser: (user: User) => void;
  login: (username: string, pass: string) => { success: boolean; error?: string; lockedSeconds?: number };
  logout: () => void;
  changePassword: (newPass: string) => { success: boolean; error?: string };
  resetUserPassword: (userId: string) => boolean;
  hasPermission: (allowedSectors: UserSector[], requiredCompany?: CompanyId) => boolean;
  unlockUserAccount: (userId: string) => void;
  refreshUsers: () => void;
  lockoutTimer: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => api.getUsers());

  // Controla se há sessão ativa autenticada
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const storedId = localStorage.getItem('saleon_curr_user_id');
    const users = api.getUsers();
    return Boolean(storedId && users.some((u) => u.id === storedId));
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const users = api.getUsers();
    const storedId = localStorage.getItem('saleon_curr_user_id');
    const found = users.find((u) => u.id === storedId);
    return found || users[0] || {
      id: 'usr_admin',
      nome: 'Administrador Geral',
      email: 'admin@saleon.com.br',
      username: 'admin',
      funcao: 'Administrador do Sistema / Root',
      setor: 'root',
      empresa: 'TODAS',
      escopo: 'todas',
      isRoot: true,
      ativo: true,
      precisaAlterarSenha: true,
      primeiroLoginRealizado: false,
      tentativasFalhas: 0,
      bloqueadoAte: null,
      criadoEm: '2025-01-01T08:00:00Z',
    };
  });

  const [currentCompany, setCurrentCompany] = useState<CompanyId>(() => {
    const storedComp = localStorage.getItem('saleon_curr_company') as CompanyId;
    return storedComp === 'LA' ? 'LA' : 'FC';
  });

  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Efeito para contador regressivo de rate limit
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const refreshUsers = () => {
    const updated = api.getUsers();
    setAllUsers(updated);
    if (currentUser) {
      const refreshedMe = updated.find((u) => u.id === currentUser.id);
      if (refreshedMe) {
        setCurrentUser(refreshedMe);
      }
    }
  };

  const switchCompany = (company: CompanyId) => {
    setCurrentCompany(company);
    localStorage.setItem('saleon_curr_company', company);
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('saleon_curr_user_id', user.id);
    if (user.empresa === 'FC' || user.empresa === 'LA') {
      switchCompany(user.empresa);
    }
  };

  const login = (username: string, pass: string) => {
    const res = api.login(username, pass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      localStorage.setItem('saleon_curr_user_id', res.user.id);
      if (res.user.empresa === 'FC' || res.user.empresa === 'LA') {
        switchCompany(res.user.empresa);
      }
      refreshUsers();
      return { success: true };
    }
    if (res.lockedSeconds) {
      setLockoutTimer(res.lockedSeconds);
    }
    refreshUsers();
    return { success: false, error: res.error, lockedSeconds: res.lockedSeconds };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('saleon_curr_user_id');
  };

  const changePassword = (newPass: string) => {
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado.' };
    }
    const result = api.changeUserPassword(currentUser.id, newPass);
    if (result.success) {
      refreshUsers();
    }
    return result;
  };

  const resetUserPassword = (userId: string) => {
    const ok = api.resetUserPasswordToDefault(userId);
    if (ok) {
      refreshUsers();
    }
    return ok;
  };

  const unlockUserAccount = (userId: string) => {
    api.unlockUser(userId);
    refreshUsers();
    setLockoutTimer(0);
  };

  /**
   * Checagem de permissão:
   * - Root sempre tem acesso total
   * - Setor deve estar na lista permitida
   * - Se tela exigir empresa (ex: LA Dashboard), verifica se usuário tem acesso à empresa
   */
  const hasPermission = (allowedSectors: UserSector[], requiredCompany?: CompanyId): boolean => {
    if (!currentUser) return false;
    if (currentUser.isRoot || currentUser.setor === 'root') return true;

    // Checagem de setor
    const sectorAllowed = allowedSectors.includes(currentUser.setor);
    if (!sectorAllowed) return false;

    // Checagem de escopo de empresa
    if (requiredCompany && currentUser.empresa !== 'TODAS' && currentUser.empresa !== requiredCompany) {
      return false;
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        currentCompany,
        allUsers,
        switchCompany,
        switchUser,
        login,
        logout,
        changePassword,
        resetUserPassword,
        hasPermission,
        unlockUserAccount,
        refreshUsers,
        lockoutTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
