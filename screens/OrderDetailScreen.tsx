import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { OrderTrafficLightBadge } from '../components/OrderTrafficLightBadge';
import { OrderActionsModal } from '../components/OrderActionsModal';
import { STATUS_LABELS, getAvailableActions, ActionDefinition } from '../services/orderStateMachine';
import { SalesOrder, OrderAction } from '../types/erp';
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Truck,
  Box,
  DollarSign,
  History,
  Barcode,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Scale,
  MapPin,
  Calendar,
  Building,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  order: SalesOrder;
}

export const OrderDetailScreen: React.FC<Props> = ({ order }) => {
  const { closeOrderDetail, executeAction, addToast, refreshOrders } = useErp();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'geral' | 'itens' | 'nfe' | 'medidas' | 'logistica' | 'financeiro' | 'auditoria'>('geral');
  const [modalActionDef, setModalActionDef] = useState<ActionDefinition | null>(null);
  const [isSyncingBling, setIsSyncingBling] = useState(false);

  // Calcula ações disponíveis para o perfil do usuário e status atual do pedido
  const availableActions = getAvailableActions(order, currentUser.setor, currentUser.isRoot);
  const statusMeta = STATUS_LABELS[order.status];

  const handleActionClick = (actionDef: ActionDefinition) => {
    // Se a ação exige parâmetros (ex: NF, medidas, rastreio, cancelamento), abre modal
    if (actionDef.exigeParametros) {
      setModalActionDef(actionDef);
    } else {
      executeAction(order.id, actionDef.acao);
    }
  };

  const handleManualBlingSync = () => {
    setIsSyncingBling(true);
    setTimeout(() => {
      executeAction(order.id, 'sincronizar_bling');
      setIsSyncingBling(false);
      addToast({
        tipo: 'sucesso',
        titulo: 'Bling API v3 Sincronizado',
        descricao: 'Dados atualizados com sucesso via endpoint /api/pedidos-vendas/:id/atualizar-bling?silent=1.',
      });
    }, 600);
  };

  const handleWhatsAppBilling = () => {
    const res = api.generateWhatsAppBilling(order.id);
    if (res.success) {
      refreshOrders();
      window.open(res.link, '_blank');
      addToast({
        tipo: 'sucesso',
        titulo: 'Cobrança WhatsApp Gerada',
        descricao: 'Link gerado e disparado com sucesso conforme template configurado.',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior de Navegação & Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={closeOrderDetail}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Voltar para a listagem"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 font-mono">
                  Pedido #{order.numeroPedido}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {order.rootId} (Multiempresa)
                </span>
                <OrderTrafficLightBadge color={order.semaforoPrazo} days={order.diasCorridos} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Criado em {new Date(order.dataCriacao).toLocaleString('pt-BR')} • Origem: {order.origem.toUpperCase()} {order.numeroOrcamentoBling ? `(Orçamento Bling #${order.numeroOrcamentoBling})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualBlingSync}
              disabled={isSyncingBling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Sincronizar dados com o Bling ERP v3"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBling ? 'animate-spin' : ''}`} />
              <span>{isSyncingBling ? 'Sincronizando...' : 'Bling Sync'}</span>
            </button>

            <button
              onClick={handleWhatsAppBilling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-2xs"
              title="Gerar e disparar cobrança por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Cobrança WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Banner do Status Atual e Bling Sync */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status Atual:</span>
            <span className={`px-2.5 py-1 rounded-md font-bold border ${statusMeta.badgeClass}`}>
              {statusMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span>Sincronização Bling:</span>
            {order.blingSincronizado ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conectado (ID: {order.blingId || 'N/A'})
              </span>
            ) : (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Pendente de Envio
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Execução das 22 Ações da Máquina de Estados */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Ações Operacionais Disponíveis para ({currentUser.setor})
          </span>
          <span className="text-[11px] text-slate-400">
            {availableActions.length} ações mapeadas para esta etapa
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {availableActions.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Nenhuma ação permitida para seu setor ({currentUser.setor}) no status atual. Alterne para o perfil responsável no topo para avançar.
            </p>
          ) : (
            availableActions.map((actionDef) => (
              <button
                key={actionDef.acao}
                onClick={() => handleActionClick(actionDef)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                  actionDef.corBotao || 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title={actionDef.descricao}
              >
                {actionDef.rotulo}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Abas dos 110 Campos */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 gap-1 overflow-x-auto text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'geral' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Visão Geral &amp; Cliente</span>
        </button>
        <button
          onClick={() => setActiveTab('itens')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'itens' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Barcode className="w-3.5 h-3.5" />
          <span>Itens &amp; Bipagem ({order.itens.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('nfe')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'nfe' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Nota Fiscal (NF-e)</span>
        </button>
        <button
          onClick={() => setActiveTab('medidas')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'medidas' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Medidas &amp; Volumes</span>
        </button>
        <button
          onClick={() => setActiveTab('logistica')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'logistica' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Expedição &amp; Rastreio</span>
        </button>
        <button
          onClick={() => setActiveTab('financeiro')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'financeiro' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Financeiro &amp; Cobrança</span>
        </button>
        <button
          onClick={() => setActiveTab('auditoria')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'auditoria' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Auditoria ({order.historicoTransicoes.length})</span>
        </button>
      </div>

      {/* Conteúdo da Aba */}
      <div className="bg-white p-6 rounded-b-xl border border-slate-200 border-t-0 shadow-2xs min-h-[420px]">
        {/* Aba 1: Geral & Cliente */}
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building className="w-4 h-4 text-blue-600" />
                Dados do Destinatário / Cliente
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block">Razão Social / Nome:</span>
                  <strong className="text-slate-800">{order.clienteNome}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">CPF / CNPJ:</span>
                  <strong className="font-mono text-slate-800">{order.clienteCpfCnpj}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Inscrição Estadual / RG:</span>
                  <span className="text-slate-800">{order.clienteRgIe || 'ISENTO'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tipo Pessoa:</span>
                  <span className="text-slate-800">{order.clienteTipoPessoa === 'J' ? 'Jurídica' : 'Física'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">E-mail:</span>
                  <span className="text-slate-800">{order.clienteEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">WhatsApp / Telefone:</span>
                  <span className="text-slate-800 font-medium">{order.clienteWhatsApp}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block mb-1">Endereço de Entrega:</span>
                <p className="text-slate-800 font-medium">
                  {order.clienteEndereco}, {order.clienteNumero} {order.clienteComplemento ? ` - ${order.clienteComplemento}` : ''}
                </p>
                <p className="text-slate-600">
                  {order.clienteBairro} • {order.clienteCidade}/{order.clienteUf} • CEP {order.clienteCep}
                </p>
              </div>
            </div>

            {/* Dados Comerciais & Vendedor */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <UserIcon className="w-4 h-4 text-blue-600" />
                Origem &amp; Condições Comerciais
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block">Vendedor Responsável:</span>
                  <strong className="text-slate-800">{order.vendedorNome}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Comissão:</span>
                  <strong className="text-emerald-700">
                    {order.percentualComissao}% (R$ {order.valorComissao.toFixed(2)})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Canal de Venda:</span>
                  <span className="text-slate-800">{order.canalVenda}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Forma de Pagamento:</span>
                  <span className="text-slate-800 font-semibold">{order.formaPagamento} ({order.condicaoPagamento})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Subtotal:</span>
                  <span className="text-slate-800">R$ {order.valorSubtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Desconto Aplicado:</span>
                  <span className="text-rose-700 font-semibold">R$ {order.valorDesconto.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Frete ({order.tipoFrete}):</span>
                  <span className="text-slate-800">R$ {order.valorFrete.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total do Pedido:</span>
                  <strong className="text-base text-slate-900 font-mono">
                    R$ {order.valorTotal.toFixed(2)}
                  </strong>
                </div>
              </div>

              {order.observacoesInternas && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900">
                  <span className="font-bold block mb-0.5">Observações Internas:</span>
                  <p>{order.observacoesInternas}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba 2: Itens do Pedido & Bipagem */}
        {activeTab === 'itens' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lista de Produtos do Pedido</h3>
                <p className="text-slate-500">
                  Conferência de itens da bancada com validação de código de barras
                </p>
              </div>
              <button
                onClick={() => {
                  executeAction(order.id, 'conferir_logistica');
                  addToast({ tipo: 'sucesso', titulo: 'Todos os itens bipados e validados' });
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Bipar Todos os Itens
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Código SKU</th>
                    <th className="px-3 py-2.5">Descrição</th>
                    <th className="px-3 py-2.5">Localização Galpão</th>
                    <th className="px-3 py-2.5">Qtd</th>
                    <th className="px-3 py-2.5">Valor Unit.</th>
                    <th className="px-3 py-2.5">Valor Total</th>
                    <th className="px-3 py-2.5 text-center">Conferido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.itens.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{item.codigo}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{item.descricao}</td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono">{item.localizacaoEstoque || 'RUA-A-01'}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{item.quantidade} {item.unidade}</td>
                      <td className="px-3 py-2.5 font-mono">R$ {item.valorUnitario.toFixed(2)}</td>
                      <td className="px-3 py-2.5 font-mono font-bold">R$ {item.valorTotal.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-center">
                        {item.conferido ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bipado
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              item.conferido = true;
                              refreshOrders();
                            }}
                            className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
                          >
                            Bipar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aba 3: Nota Fiscal (NF-e) */}
        {activeTab === 'nfe' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Faturamento &amp; Dados Fiscais SEFAZ</h3>
                <p className="text-slate-500">Emissão e consulta do Documento Auxiliar da Nota Fiscal Eletrônica (DANFE)</p>
              </div>
              <button
                onClick={() => handleActionClick({ acao: 'marcar_nf_gerada', rotulo: 'Emitir / Informar NF', descricao: 'Registrar NF', setoresPermitidos: ['financeiro', 'root'], statusOrigem: [order.status], statusDestino: 'aguardando_envio', exigeParametros: true })}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Informar / Atualizar NF-e
              </button>
            </div>

            {order.numeroNf ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-500 block">Número da NF-e:</span>
                    <strong className="text-base text-slate-900 font-mono">{order.numeroNf}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Série:</span>
                    <strong className="text-slate-900">{order.serieNf || '1'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Emitida em:</span>
                    <span className="text-slate-800">
                      {order.nfGeradaEm ? new Date(order.nfGeradaEm).toLocaleString('pt-BR') : 'Hoje'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Valor Autorizado:</span>
                    <strong className="text-emerald-700 font-mono text-base">
                      R$ {(order.valorNf || order.valorTotal).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Chave de Acesso SEFAZ (44 dígitos):</span>
                  <p className="font-mono bg-white p-2.5 rounded border border-slate-300 text-slate-800 break-all select-all">
                    {order.chaveAcessoNf || '41261184112564000192550010000541201998822110'}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  {order.linkDanfe && (
                    <a
                      href={order.linkDanfe}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visualizar DANFE (PDF)
                    </a>
                  )}
                  {order.linkXmlNf && (
                    <a
                      href={order.linkXmlNf}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                    >
                      Baixar XML da NF-e
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <p>Nenhuma Nota Fiscal emitida para este pedido no momento.</p>
                <p className="text-[11px] mt-1">Conclua a conferência de logística para liberar a emissão da NF.</p>
              </div>
            )}
          </div>
        )}

        {/* Aba 4: Medidas & Embalagem */}
        {activeTab === 'medidas' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Pesagem, Cubagem e Embalagem</h3>
                <p className="text-slate-500">Dados fundamentais para cálculo de frete e etiquetagem da transportadora</p>
              </div>
              <button
                onClick={() => handleActionClick({ acao: 'editar_medidas', rotulo: 'Editar Medidas', descricao: 'Ajustar medidas', setoresPermitidos: ['separador', 'conferente', 'logistica', 'root'], statusOrigem: [order.status], statusDestino: 'dinamico', exigeParametros: true })}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Ajustar Medidas &amp; Peso
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Quantidade de Volumes:</span>
                <strong className="text-xl text-slate-900">{order.medidas.volumes} vol</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Peso Bruto Aferido:</span>
                <strong className="text-xl text-slate-900">{order.medidas.pesoBrutoKg} kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Peso Líquido:</span>
                <strong className="text-xl text-slate-900">{order.medidas.pesoLiquidoKg} kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Cubagem M3:</span>
                <strong className="text-xl text-blue-700 font-mono">
                  {order.medidas.cubagemM3.toFixed(4)} m³
                </strong>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-slate-500 block mb-1">Dimensões da Embalagem (Comp x Larg x Alt):</span>
              <p className="font-mono text-sm font-semibold text-slate-800">
                {order.medidas.comprimentoCm} cm × {order.medidas.larguraCm} cm × {order.medidas.alturaCm} cm
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                Tipo de Embalagem: <strong>{order.medidas.tipoEmbalagem}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Aba 5: Expedição & Rastreio */}
        {activeTab === 'logistica' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Transportadora &amp; Despacho</h3>
                <p className="text-slate-500">Dados do frete homologado, romaneio e código de rastreamento</p>
              </div>
              <button
                onClick={() => handleActionClick({ acao: 'despachar_coleta', rotulo: 'Despachar Coleta', descricao: 'Despacho', setoresPermitidos: ['logistica', 'gerente_logistica', 'root'], statusOrigem: [order.status], statusDestino: 'coleta_final', exigeParametros: true })}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold"
              >
                Registrar Coleta / Despacho
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Transportadora Homologada:</span>
                <strong className="text-slate-900">{order.transportadoraNome}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Modalidade do Frete:</span>
                <strong className="text-slate-900">{order.tipoFrete} ({order.servicoTransporte})</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Código de Rastreamento:</span>
                <strong className="font-mono text-blue-700">
                  {order.codigoRastreio || 'Aguardando despacho'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Número do Romaneio:</span>
                <span className="font-mono text-slate-800">{order.romaneioId || 'Não gerado'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Coletado por:</span>
                <span className="text-slate-800">{order.coletaRealizadaPor || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Despachado em:</span>
                <span className="text-slate-800">
                  {order.despachadoEm ? new Date(order.despachadoEm).toLocaleString('pt-BR') : '—'}
                </span>
              </div>
            </div>

            {order.urlRastreio && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-900 block">Link de Rastreio Público do Cliente:</span>
                  <span className="font-mono text-blue-700">{order.urlRastreio}</span>
                </div>
                <a
                  href={order.urlRastreio}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Abrir Rastreio
                </a>
              </div>
            )}
          </div>
        )}

        {/* Aba 6: Financeiro & Cobrança */}
        {activeTab === 'financeiro' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Financeiro &amp; Cobrança WhatsApp</h3>
                <p className="text-slate-500">Conciliação de recebíveis e disparo de avisos de pagamento</p>
              </div>
              <button
                onClick={handleWhatsAppBilling}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Disparar WhatsApp de Cobrança
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Forma de Pagamento:</span>
                <strong className="text-slate-900">{order.formaPagamento}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Condição Comercial:</span>
                <strong className="text-slate-900">{order.condicaoPagamento}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Status da Liquidação:</span>
                {order.pagamentoConfirmado ? (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Liquidado / Confirmado
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Pendente de Liquidação
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Cobrança WhatsApp Enviada?</span>
                <span className="text-slate-800">
                  {order.cobrancaEnviadaWhatsApp ? 'Sim (Enviada)' : 'Não'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Último Disparo:</span>
                <span className="text-slate-800">
                  {order.cobrancaUltimoEnvio ? new Date(order.cobrancaUltimoEnvio).toLocaleString('pt-BR') : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Aba 7: Auditoria das 22 Ações */}
        {activeTab === 'auditoria' && (
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Linha do Tempo e Log de Auditoria</h3>
              <p className="text-slate-500">
                Rastreabilidade completa de todas as transições de status e ações executadas
              </p>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pl-4">
              {order.historicoTransicoes.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {log.acao.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.dataHora).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                      <span>Executado por: <strong>{log.usuarioNome}</strong> ({log.setorUsuario})</span>
                      <span>•</span>
                      <span>De: <strong>{log.statusAnterior}</strong> &rarr; Para: <strong>{log.statusNovo}</strong></span>
                    </div>
                    {log.detalhes && (
                      <p className="text-xs text-slate-700 mt-1.5 italic bg-white p-2 rounded border border-slate-100">
                        "{log.detalhes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal dinâmico para ações com parâmetros */}
      {modalActionDef && (
        <OrderActionsModal
          order={order}
          actionDef={modalActionDef}
          onClose={() => setModalActionDef(null)}
        />
      )}
    </div>
  );
};
