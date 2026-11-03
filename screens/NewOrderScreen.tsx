import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Plus, ArrowLeft, Download, CheckCircle, PackagePlus, Trash2 } from 'lucide-react';
import { OrderItem, CompanyId } from '../types/erp';

export const NewOrderScreen: React.FC = () => {
  const { setActiveScreen, addToast, refreshOrders } = useErp();
  const { currentCompany, currentUser } = useAuth();

  const [origem, setOrigem] = useState<'bling' | 'manual'>('bling');
  const [blingOrcamentoNum, setBlingOrcamentoNum] = useState('7750');
  const [empresa, setEmpresa] = useState<CompanyId>(currentCompany);

  // Dados do Cliente
  const [clienteNome, setClienteNome] = useState('Indústria Metalúrgica Paranaense Ltda');
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState('11.222.333/0001-44');
  const [clienteEmail, setClienteEmail] = useState('compras@indmetalparana.com.br');
  const [clienteTelefone, setClienteTelefone] = useState('(41) 3222-1100');
  const [clienteWhatsApp, setClienteWhatsApp] = useState('(41) 99111-2233');
  const [clienteCep, setClienteCep] = useState('80020-000');
  const [clienteEndereco, setClienteEndereco] = useState('Rua XV de Novembro');
  const [clienteNumero, setClienteNumero] = useState('500');
  const [clienteCidade, setClienteCidade] = useState('Curitiba');
  const [clienteUf, setClienteUf] = useState('PR');

  // Itens
  const [itens, setItens] = useState<OrderItem[]>([
    {
      id: 'it_temp_1',
      codigo: 'FER-MAK-002',
      descricao: 'Esmerilhadeira Angular 4.1/2 Pol 840W 220V Makita',
      quantidade: 2,
      unidade: 'UN',
      valorUnitario: 450.0,
      valorTotal: 900.0,
      conferido: false,
    },
    {
      id: 'it_temp_2',
      codigo: 'DIS-COR-012',
      descricao: 'Disco de Corte Inox 4.1/2 Caixa 25 Unidades Norton',
      quantidade: 4,
      unidade: 'CX',
      valorUnitario: 110.0,
      valorTotal: 440.0,
      conferido: false,
    },
  ]);

  // Novo item manual
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaQtd, setNovaQtd] = useState(1);
  const [novoPreco, setNovoPreco] = useState(100.0);

  // Pagamento & Frete
  const [formaPagamento, setFormaPagamento] = useState<'PIX' | 'BOLETO' | 'CARTAO_CREDITO' | 'FATURADO'>('PIX');
  const [valorFrete, setValorFrete] = useState(65.0);
  const [valorDesconto, setValorDesconto] = useState(0);

  const subtotal = itens.reduce((acc, i) => acc + i.valorTotal, 0);
  const total = Math.max(0, subtotal + valorFrete - valorDesconto);

  const handleSimularBlingOrcamento = () => {
    setClienteNome('Fábrica de Estruturas Metálicas Pinhais S/A');
    setClienteCpfCnpj('28.441.902/0001-30');
    setClienteEmail('nfe@estruturaspinhais.ind.br');
    setClienteWhatsApp('(41) 98833-2211');
    setClienteCidade('Pinhais');
    setClienteUf('PR');
    setItens([
      {
        id: 'it_bling_1',
        codigo: 'MAQ-INV-001',
        descricao: 'Inversora de Solda HandyArc 160A Esab Bivolt',
        quantidade: 1,
        unidade: 'UN',
        valorUnitario: 1850.0,
        valorTotal: 1850.0,
        conferido: false,
      },
      {
        id: 'it_bling_2',
        codigo: 'MAS-SOL-004',
        descricao: 'Máscara de Solda Escurecimento Automático DIN 9-13',
        quantidade: 2,
        unidade: 'UN',
        valorUnitario: 220.0,
        valorTotal: 440.0,
        conferido: false,
      },
    ]);
    addToast({
      tipo: 'sucesso',
      titulo: 'Orçamento Bling Carregado',
      descricao: `Dados do orçamento #${blingOrcamentoNum} importados com sucesso da API v3.`,
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCodigo || !novaDescricao) return;
    const newItem: OrderItem = {
      id: `it_${Date.now()}`,
      codigo: novoCodigo.toUpperCase(),
      descricao: novaDescricao,
      quantidade: Number(novaQtd),
      unidade: 'UN',
      valorUnitario: Number(novoPreco),
      valorTotal: Number(novaQtd) * Number(novoPreco),
      conferido: false,
    };
    setItens([...itens, newItem]);
    setNovoCodigo('');
    setNovaDescricao('');
  };

  const handleRemoveItem = (id: string) => {
    setItens(itens.filter((i) => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itens.length === 0) {
      addToast({ tipo: 'erro', titulo: 'O pedido deve possuir ao menos 1 item' });
      return;
    }

    const newOrder = api.createOrder({
      rootId: empresa,
      origem,
      numeroOrcamentoBling: origem === 'bling' ? blingOrcamentoNum : undefined,
      clienteNome,
      clienteCpfCnpj,
      clienteEmail,
      clienteTelefone,
      clienteWhatsApp,
      clienteCep,
      clienteEndereco,
      clienteNumero,
      clienteCidade,
      clienteUf,
      vendedorId: currentUser.id,
      vendedorNome: currentUser.nome,
      valorSubtotal: subtotal,
      valorFrete,
      valorDesconto,
      valorTotal: total,
      formaPagamento,
      itens,
    });

    refreshOrders();
    addToast({
      tipo: 'sucesso',
      titulo: 'Pedido Criado com Sucesso',
      descricao: `Pedido #${newOrder.numeroPedido} criado e enviado para Conferência de Pagamento.`,
    });
    setActiveScreen('pedidos');
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Topo */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('pedidos')}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Novo Pedido de Venda</h1>
            <p className="text-xs text-slate-500">
              Nascido de orçamento do Bling API v3 ou inclusão manual multiempresa (FC / LA).
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origem e Empresa */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Empresa / Multi-inquilino *</label>
            <select
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value as CompanyId)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-semibold"
            >
              <option value="FC">FC - Ferramentas Curitiba (Matriz)</option>
              <option value="LA">LA - Loja do Abastecimento</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Origem do Pedido *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrigem('bling')}
                className={`flex-1 py-2 rounded-lg font-semibold border ${
                  origem === 'bling' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-300'
                }`}
              >
                Orçamento Bling
              </button>
              <button
                type="button"
                onClick={() => setOrigem('manual')}
                className={`flex-1 py-2 rounded-lg font-semibold border ${
                  origem === 'manual' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-300'
                }`}
              >
                Inclusão Manual
              </button>
            </div>
          </div>

          {origem === 'bling' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1"># Orçamento Bling</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={blingOrcamentoNum}
                  onChange={(e) => setBlingOrcamentoNum(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleSimularBlingOrcamento}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shrink-0"
                  title="Importar dados do Bling"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cliente */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Dados do Cliente &amp; Local de Entrega
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Razão Social / Nome Completo *</label>
              <input
                type="text"
                required
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CPF / CNPJ *</label>
              <input
                type="text"
                required
                value={clienteCpfCnpj}
                onChange={(e) => setClienteCpfCnpj(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-mail *</label>
              <input
                type="email"
                required
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefone Fixo</label>
              <input
                type="text"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp para Cobrança *</label>
              <input
                type="text"
                required
                value={clienteWhatsApp}
                onChange={(e) => setClienteWhatsApp(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Logradouro</label>
              <input
                type="text"
                value={clienteEndereco}
                onChange={(e) => setClienteEndereco(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Número</label>
              <input
                type="text"
                value={clienteNumero}
                onChange={(e) => setClienteNumero(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cidade / UF</label>
              <input
                type="text"
                value={`${clienteCidade}/${clienteUf}`}
                onChange={(e) => {
                  const [cidade, uf] = e.target.value.split('/');
                  setClienteCidade(cidade || '');
                  setClienteUf(uf || 'PR');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-bold text-slate-900 text-sm">Itens e Mercadorias</h2>
            <span className="font-semibold text-slate-500">{itens.length} itens adicionados</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2">Qtd</th>
                  <th className="px-3 py-2">Preço Unit.</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2 text-right">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itens.map((it) => (
                  <tr key={it.id}>
                    <td className="px-3 py-2 font-mono font-bold">{it.codigo}</td>
                    <td className="px-3 py-2 font-medium">{it.descricao}</td>
                    <td className="px-3 py-2 font-bold">{it.quantidade}</td>
                    <td className="px-3 py-2 font-mono">R$ {it.valorUnitario.toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono font-bold">R$ {it.valorTotal.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.id)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Adicionar item rápido */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Código SKU</label>
              <input
                type="text"
                placeholder="Ex: FER-MAK-09"
                value={novoCodigo}
                onChange={(e) => setNovoCodigo(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Nome do produto"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qtd x R$</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="1"
                  value={novaQtd}
                  onChange={(e) => setNovaQtd(Number(e.target.value))}
                  className="w-14 px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
                />
                <input
                  type="number"
                  step="0.01"
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>
        </div>

        {/* Resumo Financeiro & Conclusão */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Condição de Pagamento</h3>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="PIX">PIX Antecipado (Liberação Imediata)</option>
                <option value="BOLETO">Boleto Bancário (14/28 DDL)</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="FATURADO">Faturado 30 Dias (Exige Aprovação)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal dos Itens:</span>
              <strong className="font-mono">R$ {subtotal.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Frete (R$):</span>
              <input
                type="number"
                value={valorFrete}
                onChange={(e) => setValorFrete(Number(e.target.value))}
                className="w-24 px-2 py-1 border border-slate-300 rounded text-right font-mono text-xs bg-white"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Desconto Comercial (R$):</span>
              <input
                type="number"
                value={valorDesconto}
                onChange={(e) => setValorDesconto(Number(e.target.value))}
                className="w-24 px-2 py-1 border border-slate-300 rounded text-right font-mono text-xs bg-white text-rose-600"
              />
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Valor Total:</span>
              <span className="text-base text-blue-700 font-mono">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveScreen('pedidos')}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            Criar Pedido de Venda
          </button>
        </div>
      </form>
    </div>
  );
};
