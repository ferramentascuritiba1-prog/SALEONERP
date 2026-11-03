import React from 'react';
import { ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useErp } from '../context/ErpContext';
import { UserSector } from '../types/erp';

interface Props {
  telaNome: string;
  setoresPermitidos: UserSector[];
  sugestaoUsuarioSetor?: UserSector;
}

export const AccessDenied403: React.FC<Props> = ({
  telaNome,
  setoresPermitidos,
  sugestaoUsuarioSetor = 'root',
}) => {
  const { currentUser, allUsers, switchUser } = useAuth();
  const { setActiveScreen } = useErp();

  const suggestedUser =
    allUsers.find((u) => u.setor === sugestaoUsuarioSetor && u.ativo) ||
    allUsers.find((u) => u.isRoot) ||
    allUsers[0];

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
          <ShieldAlert className="w-9 h-9 text-rose-600" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 mb-2">
          HTTP 403 Forbidden
        </span>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Não Autorizado</h2>
        <p className="text-sm text-slate-600 mb-6">
          A tela <strong className="text-slate-800">"{telaNome}"</strong> é restrita pelas políticas de segurança do Saleon ERP.
        </p>

        <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200 text-left text-xs space-y-2">
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Seu usuário atual:</span>
            <span className="font-semibold text-slate-800">
              {currentUser.nome} ({currentUser.setor})
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Sua empresa / escopo:</span>
            <span className="font-semibold text-slate-800">
              {currentUser.empresa} ({currentUser.escopo})
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Setores com permissão nesta tela:</span>
            <div className="flex flex-wrap gap-1">
              {setoresPermitidos.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px]">
                  {s}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px]">root</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>

          {suggestedUser && (
            <button
              onClick={() => switchUser(suggestedUser)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm shadow-sm transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Simular como {suggestedUser.nome} ({suggestedUser.setor})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
