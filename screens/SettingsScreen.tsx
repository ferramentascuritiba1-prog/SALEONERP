import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useErp } from '../context/ErpContext';
import { api } from '../services/api';
import {
  Settings,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Save,
  Key,
  Globe,
  MessageCircle,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useErp();

  const [settings, setSettings] = useState(() => api.getSettings());
  const [revealedSecrets, setRevealedSecrets] = useState(false);

  // Form states
  const [fcClientId, setFcClientId] = useState(settings.blingFcClientId);
  const [fcSecret, setFcSecret] = useState(settings.blingFcClientSecretMasked);

  const [laClientId, setLaClientId] = useState(settings.blingLaClientId);
  const [laSecret, setLaSecret] = useState(settings.blingLaClientSecretMasked);

  const [whatsappUrl, setWhatsappUrl] = useState(settings.whatsappApiUrl);
  const [whatsappTemplate, setWhatsappTemplate] = useState(settings.whatsappTemplateCobranca);
  const [osrmUrl, setOsrmUrl] = useState(settings.osrmEndpointUrl);

  const handleToggleReveal = () => {
    if (!currentUser.isRoot) {
      addToast({
        tipo: 'erro',
        titulo: 'Acesso Negado',
        descricao: 'Apenas usuários com perfil Root podem desmascarar credenciais sensíveis de integração.',
      });
      return;
    }
    setRevealedSecrets(!revealedSecrets);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    api.saveSettings({
      blingFcClientId: fcClientId,
      blingLaClientId: laClientId,
      whatsappApiUrl: whatsappUrl,
      whatsappTemplateCobranca: whatsappTemplate,
      osrmEndpointUrl: osrmUrl,
    });
    setSettings(api.getSettings());
    addToast({
      tipo: 'sucesso',
      titulo: 'Configurações Atualizadas',
      descricao: 'Credenciais e templates do ERP salvos com criptografia.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Configurações &amp; Credenciais de Integração</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">
              Segurança Criptográfica
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Conexão com Bling API v3, Gateway de WhatsApp e OSRM. Segredos devidamente protegidos e mascarados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleReveal}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start"
        >
          {revealedSecrets ? <EyeOff className="w-4 h-4 text-rose-600" /> : <Eye className="w-4 h-4 text-blue-600" />}
          <span>{revealedSecrets ? 'Ocultar Segredos' : 'Revelar Segredos (Root)'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Bling Matriz FC */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Integração Bling v3 — Matriz FC (Ferramentas Curitiba)</h2>
            </div>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded text-[11px] border border-emerald-200">
              Status: {settings.blingFcStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Client ID (OAuth v3)</label>
              <input
                type="text"
                value={fcClientId}
                onChange={(e) => setFcClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Client Secret <span className="text-[10px] text-slate-400 font-normal">(Mascarado na API)</span>
              </label>
              <div className="relative">
                <input
                  type={revealedSecrets ? 'text' : 'password'}
                  value={revealedSecrets ? 'sec_live_998248102381273812' : fcSecret}
                  onChange={(e) => setFcSecret(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-slate-50"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Bling Filial LA */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h2 className="font-bold text-slate-900 text-sm">Integração Bling v3 — Loja do Abastecimento (LA)</h2>
            </div>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded text-[11px] border border-emerald-200">
              Status: {settings.blingLaStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Client ID LA (OAuth v3)</label>
              <input
                type="text"
                value={laClientId}
                onChange={(e) => setLaClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Client Secret LA <span className="text-[10px] text-slate-400 font-normal">(Mascarado na API)</span>
              </label>
              <div className="relative">
                <input
                  type={revealedSecrets ? 'text' : 'password'}
                  value={revealedSecrets ? 'sec_live_la_3309182390123' : laSecret}
                  onChange={(e) => setLaSecret(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-slate-50"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Gateway & Template */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Gateway de Cobrança WhatsApp (API Oficial)
            </h2>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded text-[11px] border border-emerald-200">
              Status: {settings.whatsappStatus}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">URL Endpoint do Gateway</label>
            <input
              type="text"
              value={whatsappUrl}
              onChange={(e) => setWhatsappUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Template Dinâmico da Mensagem de Cobrança
            </label>
            <textarea
              rows={3}
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Variáveis suportadas: <code className="text-blue-600 font-bold">&#123;&#123;CLIENTE&#125;&#125;</code>, <code className="text-blue-600 font-bold">&#123;&#123;NUMERO_PEDIDO&#125;&#125;</code>, <code className="text-blue-600 font-bold">&#123;&#123;VALOR&#125;&#125;</code>, <code className="text-blue-600 font-bold">&#123;&#123;LINK&#125;&#125;</code>
            </p>
          </div>
        </div>

        {/* Roteirizador OSRM */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Globe className="w-4 h-4 text-blue-600" />
            Serviço de Roteirização OSRM &amp; OpenStreetMap
          </h2>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Endpoint OSRM Routing Service</label>
            <input
              type="text"
              value={osrmUrl}
              onChange={(e) => setOsrmUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-2xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações com Segurança</span>
          </button>
        </div>
      </form>
    </div>
  );
};
