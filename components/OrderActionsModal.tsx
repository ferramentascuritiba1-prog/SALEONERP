import React, { useState } from 'react';
import { SalesOrder, OrderAction } from '../types/erp';
import { ActionDefinition } from '../services/orderStateMachine';
import { useErp } from '../context/ErpContext';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  order: SalesOrder;
  actionDef: ActionDefinition;
  onClose: () => void;
}

export const OrderActionsModal: React.FC<Props> = ({ order, actionDef, onClose }) => {
  const { executeAction } = useErp();

  // Estados dos parâmetros dinâmicos
  const [numeroNf, setNumeroNf] = useState(order.numeroNf || `${Math.floor(Math.random() * 90000 + 10000)}`);
  const [serieNf, setSerieNf] = useState(order.serieNf || '1');
  const [chaveAcessoNf, setChaveAcessoNf] = useState(
    order.chaveAcessoNf || `412611${Math.random().toString().slice(2, 16)}550010000${numeroNf}1998822110`
  );
  const [linkDanfe, setLinkDanfe] = useState(
    order.linkDanfe || `https://nfe.fazenda.pr.gov.br/danfe/${chaveAcessoNf}.pdf`
  );
  const [valorNf, setValorNf] = useState(order.valorNf || order.valorTotal);

  // Medidas
  const [volumes, setVolumes] = useState(order.medidas.volumes || 1);
  const [pesoBrutoKg, setPesoBrutoKg] = useState(order.medidas.pesoBrutoKg || 10);
  const [pesoLiquidoKg, setPesoLiquidoKg] = useState(order.medidas.pesoLiquidoKg || 9.5);
  const [comprimentoCm, setComprimentoCm] = useState(order.medidas.comprimentoCm || 50);
  const [larguraCm, setLarguraCm] = useState(order.medidas.larguraCm || 40);
  const [alturaCm, setAlturaCm] = useState(order.medidas.alturaCm || 30);
  const [tipoEmbalagem, setTipoEmbalagem] = useState(order.medidas.tipoEmbalagem || 'Caixa de Papelão');

  // Coleta & Despacho
  const [codigoRastreio, setCodigoRastreio] = useState(
    order.codigoRastreio || `BP-${Math.floor(Math.random() * 90000000 + 10000000)}-BR`
  );
  const [coletaRealizadaPor, setColetaRealizadaPor] = useState(
    order.coletaRealizadaPor || 'Motorista Transportadora'
  );

  // Motivos e Compras
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [fornecedorSugerido, setFornecedorSugerido] = useState('Distribuidor Autorizado');
  const [observacoes, setObservacoes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params: Record<string, any> = {
      observacoes,
    };

    if (actionDef.acao === 'marcar_nf_gerada') {
      params.numeroNf = numeroNf;
      params.serieNf = serieNf;
      params.chaveAcessoNf = chaveAcessoNf;
      params.linkDanfe = linkDanfe;
      params.valorNf = Number(valorNf);
    } else if (actionDef.acao === 'editar_medidas') {
      params.volumes = Number(volumes);
      params.pesoBrutoKg = Number(pesoBrutoKg);
      params.pesoLiquidoKg = Number(pesoLiquidoKg);
      params.comprimentoCm = Number(comprimentoCm);
      params.larguraCm = Number(larguraCm);
      params.alturaCm = Number(alturaCm);
      params.tipoEmbalagem = tipoEmbalagem;
    } else if (actionDef.acao === 'despachar_coleta') {
      params.codigoRastreio = codigoRastreio;
      params.coletaRealizadaPor = coletaRealizadaPor;
    } else if (actionDef.acao === 'cancelar_pedido') {
      params.motivoCancelamento = motivoCancelamento || 'Solicitado pelo cliente';
    } else if (actionDef.acao === 'enviar_compras') {
      params.fornecedor = fornecedorSugerido;
      params.motivo = observacoes || 'Falta física na separação';
    }

    const success = executeAction(order.id, actionDef.acao, params);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{actionDef.rotulo}</h3>
            <p className="text-xs text-slate-500">
              Pedido #{order.numeroPedido} • {order.clienteNome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <p className="text-xs text-slate-600 bg-blue-50 text-blue-900 p-2.5 rounded-lg border border-blue-200">
            {actionDef.descricao}
          </p>

          {/* Campos específicos da ação 'marcar_nf_gerada' */}
          {actionDef.acao === 'marcar_nf_gerada' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número da NF-e *
                  </label>
                  <input
                    type="text"
                    required
                    value={numeroNf}
                    onChange={(e) => setNumeroNf(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Série da NF-e
                  </label>
                  <input
                    type="text"
                    value={serieNf}
                    onChange={(e) => setSerieNf(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chave de Acesso da NF-e (44 dígitos) *
                </label>
                <input
                  type="text"
                  required
                  value={chaveAcessoNf}
                  onChange={(e) => setChaveAcessoNf(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link do DANFE (PDF)
                </label>
                <input
                  type="url"
                  value={linkDanfe}
                  onChange={(e) => setLinkDanfe(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Total da NF-e (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valorNf}
                  onChange={(e) => setValorNf(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Campos específicos da ação 'editar_medidas' */}
          {actionDef.acao === 'editar_medidas' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Volumes</label>
                  <input
                    type="number"
                    min="1"
                    value={volumes}
                    onChange={(e) => setVolumes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Peso Bruto (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pesoBrutoKg}
                    onChange={(e) => setPesoBrutoKg(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Peso Líq. (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pesoLiquidoKg}
                    onChange={(e) => setPesoLiquidoKg(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Comp. (cm)</label>
                  <input
                    type="number"
                    value={comprimentoCm}
                    onChange={(e) => setComprimentoCm(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Largura (cm)</label>
                  <input
                    type="number"
                    value={larguraCm}
                    onChange={(e) => setLarguraCm(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    value={alturaCm}
                    onChange={(e) => setAlturaCm(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo de Embalagem</label>
                <input
                  type="text"
                  value={tipoEmbalagem}
                  onChange={(e) => setTipoEmbalagem(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-600 flex justify-between">
                <span>Cubagem Calculada:</span>
                <strong className="font-mono text-slate-900">
                  {((comprimentoCm * larguraCm * alturaCm) / 1000000).toFixed(4)} m³
                </strong>
              </div>
            </div>
          )}

          {/* Campos específicos da ação 'despachar_coleta' */}
          {actionDef.acao === 'despachar_coleta' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Rastreio da Transportadora *
                </label>
                <input
                  type="text"
                  required
                  value={codigoRastreio}
                  onChange={(e) => setCodigoRastreio(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motorista / Identificação da Coleta
                </label>
                <input
                  type="text"
                  value={coletaRealizadaPor}
                  onChange={(e) => setColetaRealizadaPor(e.target.value)}
                  placeholder="Ex: Motorista Valdecir (Placa BEI-9081)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Campos específicos da ação 'cancelar_pedido' */}
          {actionDef.acao === 'cancelar_pedido' && (
            <div className="space-y-3">
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-xs border border-red-200 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>Esta ação cancelará o pedido e notificará o vendedor e o Bling.</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo do Cancelamento *
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  placeholder="Descreva o motivo detalhado do cancelamento..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Campos específicos da ação 'enviar_compras' */}
          {actionDef.acao === 'enviar_compras' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fornecedor Sugerido para Reposição
                </label>
                <input
                  type="text"
                  value={fornecedorSugerido}
                  onChange={(e) => setFornecedorSugerido(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações da Ruptura
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Item com estoque físico zerado na prateleira..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all ${actionDef.corBotao || 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Confirmar Transição
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
