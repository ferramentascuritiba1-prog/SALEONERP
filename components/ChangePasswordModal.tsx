import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useErp } from '../context/ErpContext';
import { ShieldAlert, KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ChangePasswordModal: React.FC = () => {
  const { currentUser, changePassword } = useAuth();
  const { addToast } = useErp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!currentUser || !currentUser.precisaAlterarSenha) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (newPassword === '123456') {
      setErrorMessage('A nova senha não pode ser a senha provisória padrão (123456). Escolha uma senha segura.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmação da nova senha não confere.');
      return;
    }

    setLoading(true);
    const result = changePassword(newPassword);
    setLoading(false);

    if (result.success) {
      addToast({
        tipo: 'sucesso',
        titulo: 'Senha Atualizada com Sucesso',
        descricao: 'Sua senha pessoal foi definida. Acesso liberado ao Saleon ERP.',
      });
    } else {
      setErrorMessage(result.error || 'Erro ao redefinir a senha.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 space-y-6">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Segurança do Primeiro Acesso
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">Alteração Obrigatória de Senha</h2>
            <p className="text-xs text-slate-600 mt-1">
              Olá, <strong>{currentUser.nome}</strong> ({currentUser.username}). Por política de segurança, é necessário cadastrar uma nova senha pessoal antes de acessar o sistema.
            </p>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Senha Provisória Atual
            </label>
            <input
              type="text"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite a senha provisória (ex: 123456)"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Dica: Para o primeiro login, a senha inicial é <strong>123456</strong>.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Nova Senha Pessoal *
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres (diferente de 123456)"
                className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha exatamente"
                className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Dicas de Requisitos */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Mínimo de 6 caracteres</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword && newPassword !== '123456' ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Diferente da senha padrão (123456)</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <CheckCircle2 className={`w-3.5 h-3.5 ${newPassword && newPassword === confirmPassword ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Confirmação idêntica</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Salvando Senha...' : 'Salvar Nova Senha & Acessar Sistema'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
