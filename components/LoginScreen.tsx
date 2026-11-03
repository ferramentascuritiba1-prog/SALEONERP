import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useErp } from '../context/ErpContext';
import {
  Building,
  KeyRound,
  Fingerprint,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  SunMedium,
  MoonStar,
  Info,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, lockoutTimer } = useAuth();
  const { theme, toggleTheme } = useErp();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (lockoutTimer > 0) {
      setErrorMsg(`Sistema bloqueado por segurança. Aguarde ${lockoutTimer}s.`);
      return;
    }

    setLoading(true);
    const res = login(username, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Credenciais inválidas.');
    }
  };

  const fillDefaultCredentials = () => {
    setUsername('admin');
    setPassword('123456');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-100 relative transition-colors duration-200">
      {/* Botão de Alternância de Tema Flutuante */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white shadow-2xs text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          title="Alternar Cor do Sistema (Claro / Preto)"
        >
          {theme === 'dark' ? (
            <>
              <SunMedium className="w-3.5 h-3.5 text-amber-500" />
              <span>Tema Claro</span>
            </>
          ) : (
            <>
              <MoonStar className="w-3.5 h-3.5 text-slate-700" />
              <span>Tema Preto</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Logo & Título */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-lg ring-4 ring-blue-100 font-heading">
            S
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">Saleon ERP</h1>
          <p className="text-xs text-slate-500 font-medium">
            Ferramentas Curitiba (FC, Matriz) &amp; Loja do Abastecimento (LA, Filial)
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Autenticação de Usuário</h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Proteção Brute-Force</span>
            </span>
          </div>

          {/* Banner de Rate-Limit Ativo */}
          {lockoutTimer > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-pulse">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Bloqueio Temporário Ativado</strong>
                <span>
                  3 tentativas consecutivas incorretas detectadas. Aguarde <strong>{lockoutTimer}s</strong> para tentar novamente.
                </span>
              </div>
            </div>
          )}

          {/* Banner de Erro Geral */}
          {errorMsg && lockoutTimer <= 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Login / E-mail Corporativo
              </label>
              <div className="relative">
                <Fingerprint className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-sans"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Verificação insensível a maiúsculas (case-insensitive).
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPassword ? 'Ocultar' : 'Exibir'}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutTimer > 0}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Validando Acesso...' : 'Entrar no Saleon ERP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Destaque das Credenciais Iniciais de Administrador */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 text-[11px]">Credenciais de Acesso Inicial:</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Usuário: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold text-blue-700">admin</code>
                  {' '}| Senha: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold text-blue-700">123456</code>
                </p>
                <p className="text-[10px] text-amber-700 mt-1 font-semibold">
                  * Redefinição de senha obrigatória no primeiro acesso.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="w-full text-center text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline pt-1 block cursor-pointer"
            >
              Preencher login de administrador
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          Saleon ERP &bull; Operação comercial, expedição e sincronização Bling API v3
        </div>
      </div>
    </div>
  );
};
