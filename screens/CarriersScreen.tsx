import React, { useState } from 'react';
import { api } from '../services/api';
import { Carrier } from '../types/erp';
import { useErp } from '../context/ErpContext';
import { Truck, Plus, CheckCircle, ShieldCheck, Phone, Link2 } from 'lucide-react';

export const CarriersScreen: React.FC = () => {
  const [carriers, setCarriers] = useState<Carrier[]>(() => api.getCarriers());
  const [showModal, setShowModal] = useState(false);
  const { addToast } = useErp();

  // Form states
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [tipo, setTipo] = useState<Carrier['tipo']>('RODOVIARIO');
  const [prazoMedioDias, setPrazoMedioDias] = useState(3);
  const [taxaMinima, setTaxaMinima] = useState(40.0);
  const [contatoColeta, setContatoColeta] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleCreateCarrier = (e: React.FormEvent) => {
    e.preventDefault();
    const created = api.saveCarrier({
      nome,
      cnpj,
      tipo,
      prazoMedioDias: Number(prazoMedioDias),
      taxaMinima: Number(taxaMinima),
      contatoColeta,
      telefone,
    });
    setCarriers(api.getCarriers());
    setShowModal(false);
    setNome('');
    setCnpj('');
    addToast({
      tipo: 'sucesso',
      titulo: 'Transportadora Homologada',
      descricao: `${created.nome} cadastrada no catálogo normalizado.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Catálogo Normalizado de Transportadoras</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Anti-Texto Livre
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Eliminação de transportadoras em texto livre no banco de dados. Cadastros vinculados por chave estrangeira id.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Transportadora</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {carriers.map((carrier) => (
          <div key={carrier.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">{carrier.id}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {carrier.tipo}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">{carrier.nome}</h3>
              <p className="font-mono text-slate-500 text-[11px] mt-0.5">CNPJ: {carrier.cnpj}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Prazo Médio Entrega:</span>
                <strong className="text-slate-800">{carrier.prazoMedioDias} dias úteis</strong>
              </div>
              <div className="flex justify-between">
                <span>Taxa Mínima Frete:</span>
                <strong className="text-slate-800 font-mono">R$ {carrier.taxaMinima.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Central de Coleta:</span>
                <span className="text-slate-800 text-[11px] truncate max-w-[160px]">{carrier.contatoColeta}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Homologada
              </span>
              <span className="text-blue-600 font-mono font-medium truncate max-w-[150px]">
                {carrier.rastreioUrlTemplate}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Adicionar Transportadora */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Homologar Transportadora</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCarrier} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razão Social / Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CNPJ da Transportadora *</label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Modal</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="RODOVIARIO">Rodoviário</option>
                    <option value="AEREO">Aéreo</option>
                    <option value="MOTOBOY">Motoboy Express</option>
                    <option value="CORREIOS">Correios Sedex</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prazo Médio (Dias)</label>
                  <input
                    type="number"
                    min="1"
                    value={prazoMedioDias}
                    onChange={(e) => setPrazoMedioDias(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contato de Agendamento de Coleta</label>
                <input
                  type="text"
                  placeholder="Ex: Central CIC Curitiba - (41) 3333-2211"
                  value={contatoColeta}
                  onChange={(e) => setContatoColeta(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs"
                >
                  Salvar Transportadora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
