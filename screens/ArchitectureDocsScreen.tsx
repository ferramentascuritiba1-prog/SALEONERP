import React, { useState } from 'react';
import { API_CATALOG_DATA } from '../services/apiCatalog';
import { ORDER_ACTIONS_CATALOG, STATUS_LABELS } from '../services/orderStateMachine';
import {
  FileCode2,
  Database,
  GitBranch,
  ShieldCheck,
  Layout,
  CalendarCheck,
  AlertOctagon,
  Copy,
  Check,
  Download,
} from 'lucide-react';

export const ArchitectureDocsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'ddl' | 'rotas' | 'maquina_estados' | 'matriz_rbac' | 'fases' | 'divida_tecnica'
  >('ddl');
  const [copied, setCopied] = useState(false);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ddlSqlCode = `-- =====================================================================
-- SALEON ERP - MODELO DE DADOS POSTGRESQL MULTIEMPRESA (FC / LA)
-- Normalizado: Elimina JSON em texto puro e transportadoras em texto livre
-- =====================================================================

-- 1. Enumerações de Domínio
CREATE TYPE company_tenant AS ENUM ('FC', 'LA');
CREATE TYPE user_sector_enum AS ENUM (
  'vendedor', 'financeiro', 'separador', 'logistica', 
  'gerente_logistica', 'comprador', 'conferente', 'sac', 'root'
);
CREATE TYPE permission_scope_enum AS ENUM ('todas', 'restrito');
CREATE TYPE order_status_enum AS ENUM (
  'conferencia_pagamento', 'aprovacao_gerente', 'novo', 'pedido_gerado',
  'em_logistica', 'aguardando_nf', 'aguardando_envio', 'coleta_final',
  'finalizado', 'compras', 'pagamento_nf', 'cancelado'
);
CREATE TYPE payment_form_enum AS ENUM ('PIX', 'BOLETO', 'CARTAO_CREDITO', 'FATURADO', 'TRANSFERENCIA');
CREATE TYPE carrier_modal_enum AS ENUM ('RODOVIARIO', 'AEREO', 'MOTOBOY', 'CORREIOS');

-- 2. Tabela de Colaboradores e Acesso (29 Usuários)
CREATE TABLE usuarios (
  id VARCHAR(32) PRIMARY KEY, -- nanoid
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  username VARCHAR(60) NOT NULL, -- Checagem UNIQUE case-insensitive via índice
  senha_hash VARCHAR(255) NOT NULL,
  setor user_sector_enum NOT NULL,
  empresa VARCHAR(10) NOT NULL DEFAULT 'FC', -- 'FC', 'LA' ou 'TODAS'
  escopo permission_scope_enum NOT NULL DEFAULT 'restrito',
  is_root BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  tentativas_falhas INT NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMP WITH TIME ZONE NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_usuarios_username_lower ON usuarios (LOWER(username));

-- 3. Catálogo Normalizado de Transportadoras Homologadas (Anti-Texto Livre)
CREATE TABLE transportadoras (
  id VARCHAR(32) PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  tipo carrier_modal_enum NOT NULL DEFAULT 'RODOVIARIO',
  prazo_medio_dias INT NOT NULL DEFAULT 3,
  taxa_minima NUMERIC(10,2) NOT NULL DEFAULT 30.00,
  contato_coleta VARCHAR(150),
  telefone VARCHAR(30),
  rastreio_url_template VARCHAR(255),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela Principal de Pedidos de Venda (~110 campos)
CREATE TABLE pedidos_vendas (
  -- Identificação e Multi-Tenant
  id VARCHAR(32) PRIMARY KEY, -- nanoid
  numero_pedido BIGSERIAL NOT NULL,
  root_id company_tenant NOT NULL DEFAULT 'FC', -- Isolamento multiempresa
  bling_id VARCHAR(50),
  bling_numero VARCHAR(50),
  numero_orcamento_bling VARCHAR(50),
  origem VARCHAR(30) NOT NULL DEFAULT 'bling', -- 'bling', 'site', 'manual', 'televendas'
  canal_venda VARCHAR(60) NOT NULL DEFAULT 'Venda Direta',

  -- Status e Workflow
  status order_status_enum NOT NULL DEFAULT 'conferencia_pagamento',
  status_anterior order_status_enum,
  status_bling_original VARCHAR(50),
  bling_sincronizado BOOLEAN NOT NULL DEFAULT FALSE,
  bling_ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
  desvio_compras BOOLEAN NOT NULL DEFAULT FALSE,
  desvio_pagamento_nf BOOLEAN NOT NULL DEFAULT FALSE,
  bloqueado_bling BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_cancelamento TEXT,

  -- Datas e SLA Semafórico
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  data_emissao_nf TIMESTAMP WITH TIME ZONE,
  data_despacho TIMESTAMP WITH TIME ZONE,
  data_previsao_entrega DATE,
  data_entrega_efetiva TIMESTAMP WITH TIME ZONE,
  dias_corridos INT GENERATED ALWAYS AS (EXTRACT(DAY FROM (CURRENT_TIMESTAMP - data_criacao))) STORED,
  -- Semáforo: verde (0-4d), amarelo (4-9d), vermelho (>9d)
  semaforo_prazo VARCHAR(10) GENERATED ALWAYS AS (
    CASE 
      WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - data_criacao)) <= 4 THEN 'verde'
      WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - data_criacao)) <= 9 THEN 'amarelo'
      ELSE 'vermelho'
    END
  ) STORED,

  -- Destinatário / Cliente
  cliente_nome VARCHAR(200) NOT NULL,
  cliente_tipo_pessoa CHAR(1) NOT NULL DEFAULT 'J', -- 'F' ou 'J'
  cliente_cpf_cnpj VARCHAR(20) NOT NULL,
  cliente_rg_ie VARCHAR(30),
  cliente_email VARCHAR(150),
  cliente_telefone VARCHAR(30),
  cliente_whatsapp VARCHAR(30),
  cliente_cep VARCHAR(10) NOT NULL,
  cliente_endereco VARCHAR(200) NOT NULL,
  cliente_numero VARCHAR(20) NOT NULL,
  cliente_complemento VARCHAR(100),
  cliente_bairro VARCHAR(100) NOT NULL,
  cliente_cidade VARCHAR(100) NOT NULL,
  cliente_uf CHAR(2) NOT NULL,
  cliente_ibge_cidade VARCHAR(10),

  -- Vendedor e Comissões
  vendedor_id VARCHAR(32) REFERENCES usuarios(id),
  vendedor_nome VARCHAR(150) NOT NULL,
  percentual_comissao NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  valor_comissao NUMERIC(12,2) NOT NULL DEFAULT 0.00,

  -- Valores Financeiros
  valor_subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  valor_desconto NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  valor_frete NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  valor_outras_despesas NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  forma_pagamento payment_form_enum NOT NULL DEFAULT 'PIX',
  condicao_pagamento VARCHAR(100) NOT NULL,
  pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
  data_confirmacao_pagamento TIMESTAMP WITH TIME ZONE,
  comprovante_pagamento_url VARCHAR(255),
  link_cobranca_whatsapp VARCHAR(500),
  cobranca_enviada_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  cobranca_ultimo_envio TIMESTAMP WITH TIME ZONE,

  -- Nota Fiscal Eletrônica (SEFAZ)
  numero_nf VARCHAR(30),
  serie_nf VARCHAR(10) DEFAULT '1',
  chave_acesso_nf CHAR(44),
  link_danfe VARCHAR(500),
  link_xml_nf VARCHAR(500),
  nf_gerada_em TIMESTAMP WITH TIME ZONE,
  nf_gerada_por VARCHAR(150),
  valor_nf NUMERIC(12,2),

  -- Logística e Expedição
  transportadora_id VARCHAR(32) REFERENCES transportadoras(id),
  transportadora_nome VARCHAR(120),
  servico_transporte VARCHAR(80),
  tipo_frete VARCHAR(10) NOT NULL DEFAULT 'CIF',
  codigo_rastreio VARCHAR(60),
  url_rastreio VARCHAR(500),
  conferente_id VARCHAR(32) REFERENCES usuarios(id),
  conferente_nome VARCHAR(150),
  separador_id VARCHAR(32) REFERENCES usuarios(id),
  separador_nome VARCHAR(150),
  inicio_separacao TIMESTAMP WITH TIME ZONE,
  fim_separacao TIMESTAMP WITH TIME ZONE,
  conferencia_realizada BOOLEAN NOT NULL DEFAULT FALSE,
  conferencia_data_hora TIMESTAMP WITH TIME ZONE,
  despachado_em TIMESTAMP WITH TIME ZONE,
  coleta_realizada_por VARCHAR(150),
  romaneio_id VARCHAR(50),
  latitude_entrega NUMERIC(10,7),
  longitude_entrega NUMERIC(10,7),

  -- Dimensões e Embalagem (Estruturado)
  volumes INT NOT NULL DEFAULT 1,
  peso_bruto_kg NUMERIC(8,3) NOT NULL DEFAULT 1.000,
  peso_liquido_kg NUMERIC(8,3) NOT NULL DEFAULT 0.900,
  comprimento_cm NUMERIC(6,1) NOT NULL DEFAULT 30.0,
  largura_cm NUMERIC(6,1) NOT NULL DEFAULT 20.0,
  altura_cm NUMERIC(6,1) NOT NULL DEFAULT 15.0,
  cubagem_m3 NUMERIC(8,4) GENERATED ALWAYS AS ((comprimento_cm * largura_cm * altura_cm) / 1000000.0) STORED,
  tipo_embalagem VARCHAR(80) NOT NULL DEFAULT 'Caixa de Papelão',

  observacoes_internas TEXT,
  observacoes_cliente TEXT
);

-- Índices estratégicos de busca e filtros operacionais
CREATE INDEX idx_pedidos_root_status ON pedidos_vendas (root_id, status);
CREATE INDEX idx_pedidos_cliente_doc ON pedidos_vendas (cliente_cpf_cnpj);
CREATE INDEX idx_pedidos_chave_nf ON pedidos_vendas (chave_acesso_nf);
CREATE INDEX idx_pedidos_numero_bling ON pedidos_vendas (numero_orcamento_bling);

-- 5. Tabela Normalizada de Itens do Pedido
CREATE TABLE pedidos_vendas_itens (
  id VARCHAR(32) PRIMARY KEY,
  pedido_id VARCHAR(32) NOT NULL REFERENCES pedidos_vendas(id) ON DELETE CASCADE,
  codigo VARCHAR(60) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL,
  unidade VARCHAR(10) NOT NULL DEFAULT 'UN',
  valor_unitario NUMERIC(12,2) NOT NULL,
  valor_total NUMERIC(12,2) NOT NULL,
  conferido BOOLEAN NOT NULL DEFAULT FALSE,
  bipado_em TIMESTAMP WITH TIME ZONE,
  faltante BOOLEAN NOT NULL DEFAULT FALSE,
  localizacao_estoque VARCHAR(50)
);

-- 6. Tabela de Auditoria Imutável das 22 Transições
CREATE TABLE pedidos_vendas_transicoes_log (
  id VARCHAR(32) PRIMARY KEY,
  pedido_id VARCHAR(32) NOT NULL REFERENCES pedidos_vendas(id) ON DELETE CASCADE,
  acao VARCHAR(60) NOT NULL,
  status_anterior order_status_enum NOT NULL,
  status_novo order_status_enum NOT NULL,
  usuario_id VARCHAR(32) NOT NULL REFERENCES usuarios(id),
  usuario_nome VARCHAR(150) NOT NULL,
  setor_usuario user_sector_enum NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  detalhes TEXT,
  parametros_metadata JSONB
);

-- 7. Tabela de Rupturas de Estoque (Compras)
CREATE TABLE compras_itens_faltantes (
  id VARCHAR(32) PRIMARY KEY,
  root_id company_tenant NOT NULL DEFAULT 'FC',
  pedido_id VARCHAR(32) NOT NULL REFERENCES pedidos_vendas(id),
  codigo_produto VARCHAR(60) NOT NULL,
  descricao_produto VARCHAR(255) NOT NULL,
  quantidade_faltante NUMERIC(10,2) NOT NULL,
  fornecedor_sugerido VARCHAR(150),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'COTADO', 'COMPRADO', 'RECEBIDO'
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_previsao_chegada TIMESTAMP WITH TIME ZONE
);

-- 8. Tabela de Configurações Globais com Credenciais Criptografadas
CREATE TABLE configuracoes_sistema (
  id INT PRIMARY KEY DEFAULT 1,
  bling_fc_client_id VARCHAR(100),
  bling_fc_client_secret_encrypted TEXT, -- Nunca armazenar em texto puro!
  bling_la_client_id VARCHAR(100),
  bling_la_client_secret_encrypted TEXT,
  whatsapp_gateway_url VARCHAR(255),
  whatsapp_api_token_encrypted TEXT,
  whatsapp_template_cobranca TEXT,
  osrm_endpoint_url VARCHAR(255) DEFAULT 'https://router.project-osrm.org',
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Central de Arquitetura &amp; 7 Entregáveis Oficiais
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Documentação Viva
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Projeto completo da arquitetura do Saleon ERP para Ferramentas Curitiba (FC) e Loja do Abastecimento (LA).
          </p>
        </div>

        <button
          onClick={() => handleCopyText(ddlSqlCode)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors self-start"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'DDL Copiado!' : 'Copiar DDL PostgreSQL'}</span>
        </button>
      </div>

      {/* Navegação entre os 7 Entregáveis */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 gap-1 overflow-x-auto text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('ddl')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ddl' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>1. Modelo DDL &amp; ERD</span>
        </button>
        <button
          onClick={() => setActiveTab('rotas')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'rotas' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>2. Catálogo da API ({API_CATALOG_DATA.length} Rotas)</span>
        </button>
        <button
          onClick={() => setActiveTab('maquina_estados')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'maquina_estados' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>3. Máquina de Estados (22 Ações)</span>
        </button>
        <button
          onClick={() => setActiveTab('matriz_rbac')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'matriz_rbac' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. Matriz de Permissões RBAC</span>
        </button>
        <button
          onClick={() => setActiveTab('fases')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'fases' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>5. Plano em Fases</span>
        </button>
        <button
          onClick={() => setActiveTab('divida_tecnica')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'divida_tecnica' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>6. Dívida Técnica &amp; Segurança</span>
        </button>
      </div>

      {/* Conteúdo do Entregável Selecionado */}
      <div className="bg-white p-6 rounded-b-xl border border-slate-200 border-t-0 shadow-2xs text-xs space-y-4">
        {/* Entregável 1: DDL & Diagrama ER */}
        {activeTab === 'ddl' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Entregável 1: Modelo de Dados Completo (DDL PostgreSQL &amp; Diagrama ER)
              </h2>
              <p className="text-slate-500">
                Esquema relacional em PostgreSQL 16 com todos os ~110 campos de pedidos_vendas, tabelas normalizadas de transportadoras, itens, medidas e auditoria.
              </p>
            </div>

            {/* Diagrama ER Visual */}
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-cyan-400 block text-xs">Diagrama ER Conceitual:</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px] font-mono">
                <div className="p-3 bg-slate-800 rounded border border-slate-700">
                  <strong className="text-yellow-400 block mb-1">usuarios</strong>
                  <span className="text-slate-300">id (PK)<br/>username (UK lower)<br/>setor (Enum 8 setores)<br/>empresa (FC/LA/TODAS)<br/>tentativas_falhas<br/>bloqueado_ate</span>
                </div>
                <div className="p-3 bg-slate-800 rounded border border-slate-700">
                  <strong className="text-blue-400 block mb-1">pedidos_vendas</strong>
                  <span className="text-slate-300">id (PK nanoid)<br/>numero_pedido (BIGINT)<br/>root_id (tenant FC/LA)<br/>status (order_status_enum)<br/>dias_corridos (SLA)<br/>vendedor_id (FK)<br/>transportadora_id (FK)<br/>+100 campos</span>
                </div>
                <div className="p-3 bg-slate-800 rounded border border-slate-700">
                  <strong className="text-emerald-400 block mb-1">pedidos_vendas_itens</strong>
                  <span className="text-slate-300">id (PK)<br/>pedido_id (FK)<br/>codigo (SKU)<br/>quantidade<br/>conferido (bipagem)<br/>bipado_em</span>
                </div>
                <div className="p-3 bg-slate-800 rounded border border-slate-700">
                  <strong className="text-purple-400 block mb-1">pedidos_transicoes_log</strong>
                  <span className="text-slate-300">id (PK)<br/>pedido_id (FK)<br/>acao (22 ações)<br/>status_anterior<br/>status_novo<br/>usuario_id (FK)<br/>data_hora</span>
                </div>
              </div>
            </div>

            {/* Código DDL SQL */}
            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[460px] leading-relaxed border border-slate-800">
                {ddlSqlCode}
              </pre>
            </div>
          </div>
        )}

        {/* Entregável 2: Catálogo de Rotas da API */}
        {activeTab === 'rotas' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Entregável 2: Catálogo de Rotas da API RESTful (104 Rotas Mapeadas)
              </h2>
              <p className="text-slate-500">
                Mapeamento exaustivo de endpoints sob <code className="text-blue-600 font-bold">/api</code> com método HTTP, controle de permissão por setor e payload de entrada/saída.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Módulo</th>
                    <th className="px-3 py-2.5">Método</th>
                    <th className="px-3 py-2.5">Endpoint (Caminho)</th>
                    <th className="px-3 py-2.5">Permissão / Setor</th>
                    <th className="px-3 py-2.5">Descrição da Operação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {API_CATALOG_DATA.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-bold text-slate-700">{r.modulo}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.metodo === 'GET'
                              ? 'bg-blue-100 text-blue-800'
                              : r.metodo === 'POST'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.metodo === 'PUT'
                              ? 'bg-amber-100 text-amber-800'
                              : r.metodo === 'PATCH'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.metodo}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-800">{r.caminho}</td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                          {r.permissao}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{r.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Entregável 3: Máquina de Estados */}
        {activeTab === 'maquina_estados' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Entregável 3: Máquina de Estados do Pedido de Venda (22 Ações Mapeadas)
              </h2>
              <p className="text-slate-500">
                Fluxo sequencial em 9 etapas na ordem exata definida na especificação, mais 3 desvios e 22 ações operacionais com setores autorizados.
              </p>
            </div>

            {/* As 9 Etapas Sequenciais */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">Fluxo Sequencial Principal (Em Ordem Estrita):</span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {[
                  '1. conferência de pagamento',
                  '2. aprovação do gerente',
                  '3. novo',
                  '4. pedido gerado',
                  '5. em logística',
                  '6. aguardando NF',
                  '7. aguardando envio',
                  '8. coleta final',
                  '9. finalizado',
                ].map((st, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-white border border-slate-300 font-semibold text-slate-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    {st}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 text-[11px] pt-1">
                <span className="font-bold text-rose-700">Desvios Mapeados:</span>
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-semibold">compras</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">pagamento da NF</span>
                <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 font-semibold">cancelado</span>
              </div>
            </div>

            {/* As 22 Ações Mapeadas */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Ação do Sistema</th>
                    <th className="px-3 py-2.5">Rótulo na UI</th>
                    <th className="px-3 py-2.5">Status de Origem</th>
                    <th className="px-3 py-2.5">Status de Destino</th>
                    <th className="px-3 py-2.5">Setores Autorizados</th>
                    <th className="px-3 py-2.5">Parâmetros Exigidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ORDER_ACTIONS_CATALOG.map((act) => (
                    <tr key={act.acao} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-bold text-slate-800">{act.acao}</td>
                      <td className="px-3 py-2 font-semibold text-blue-700">{act.rotulo}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">
                        {act.statusOrigem.join(', ')}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-emerald-700 text-[11px]">
                        {act.statusDestino}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {act.setoresPermitidos.map((s) => (
                            <span key={s} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">
                        {act.camposExigidos ? act.camposExigidos.join(', ') : 'Nenhum'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Entregável 4: Matriz de Permissões RBAC */}
        {activeTab === 'matriz_rbac' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Entregável 4: Matriz de Permissões por Setor, Empresa e Escopo
              </h2>
              <p className="text-slate-500">
                Distribuição dos 29 colaboradores nos 8 setores operacionais + Root, com escopo por tenant (FC/LA) e restrição 403 em Compras, Site e Dashboard LA.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-center text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 text-left">Setor / Perfil</th>
                    <th className="px-3 py-3">Total Usuários</th>
                    <th className="px-3 py-3">Pedidos Venda</th>
                    <th className="px-3 py-3">Financeiro</th>
                    <th className="px-3 py-3">Separação / Conf.</th>
                    <th className="px-3 py-3">Compras (403)</th>
                    <th className="px-3 py-3">Pedidos Site (403)</th>
                    <th className="px-3 py-3">Dashboard LA (403)</th>
                    <th className="px-3 py-3">Configurações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 bg-purple-50/30">
                    <td className="px-3 py-2.5 text-left font-bold text-purple-900">root (Administrador)</td>
                    <td className="px-3 py-2.5 font-bold">1</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-bold">Sim</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-left font-semibold text-slate-800">vendedor</td>
                    <td className="px-3 py-2 font-bold">6</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim (Escopo)</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2 text-slate-400">Escopo LA</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-left font-semibold text-slate-800">financeiro</td>
                    <td className="px-3 py-2 font-bold">3</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim (Total)</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2 text-slate-400">Escopo LA</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-left font-semibold text-slate-800">separador</td>
                    <td className="px-3 py-2 font-bold">4</td>
                    <td className="px-3 py-2 text-slate-400">Consulta</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim (Bipagem)</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-slate-400">Escopo LA</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-left font-semibold text-slate-800">conferente</td>
                    <td className="px-3 py-2 font-bold">4</td>
                    <td className="px-3 py-2 text-slate-400">Consulta</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim (Aferição)</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-slate-400">Escopo LA</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-left font-semibold text-slate-800">logistica</td>
                    <td className="px-3 py-2 font-bold">3</td>
                    <td className="px-3 py-2 text-slate-400">Consulta</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim (Despacho)</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-slate-400">Escopo LA</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-left font-semibold text-slate-800">gerente_logistica</td>
                    <td className="px-3 py-2 font-bold">2</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2 text-slate-400">Consulta</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim (Aprovar)</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-left font-semibold text-slate-800">comprador</td>
                    <td className="px-3 py-2 font-bold">2</td>
                    <td className="px-3 py-2 text-slate-400">Consulta</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">Sim (Total)</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-slate-400">Escopo LA</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-left font-semibold text-slate-800">sac</td>
                    <td className="px-3 py-2 font-bold">3</td>
                    <td className="px-3 py-2 text-slate-400">Consulta</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-slate-400">Não</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                    <td className="px-3 py-2 text-slate-400">Escopo LA</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">403</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Entregável 5: Plano em Fases */}
        {activeTab === 'fases' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Entregável 6: Plano de Implantação e Migração em Fases
              </h2>
              <p className="text-slate-500">
                Estratégia de entrega modular minimizando downtime operacional para FC e LA.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs">Fase 1: Fundação, Autenticação &amp; Multiempresa</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Concluída</span>
                </div>
                <p className="text-slate-600 mt-1">
                  Setup de banco relacional, separação estrita por root_id (FC e LA), login case-insensitive, rate limit com travamento automático após 3 tentativas inválidas.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs">Fase 2: Integração Bling API v3 &amp; Segurança de Segredos</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Concluída</span>
                </div>
                <p className="text-slate-600 mt-1">
                  OAuth v3 por empresa, mascaramento obrigatório de Client Secrets no endpoint /api/admin/settings, e acionamento de silent sync na 1ª abertura do pedido.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs">Fase 3: Núcleo do Pedido de Venda &amp; Máquina de Estados</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Concluída</span>
                </div>
                <p className="text-slate-600 mt-1">
                  Estrutura dos ~110 campos, cálculo automático de semáforo de prazo (Verde 0-4d, Amarelo 4-9d, Vermelho &gt;9d) e motor das 22 ações com validação de perfil.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs">Fase 4: Operação de Separação, Conferência &amp; Compras</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Concluída</span>
                </div>
                <p className="text-slate-600 mt-1">
                  Esteira com leitor de código de barras (EAN/SKU), pesagem, desvio automático de falta para o comprador e retorno suave ao fluxo.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs">Fase 5: Logística OSRM, Financeiro &amp; Cobrança WhatsApp</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Concluída</span>
                </div>
                <p className="text-slate-600 mt-1">
                  Roteirização com mapa georreferenciado, transportadoras normalizadas, retenção de NF, disparo de cobrança e portal público de rastreio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Entregável 6: Dívida Técnica & Vulnerabilidades */}
        {activeTab === 'divida_tecnica' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Entregável 7: Lista de Pontos de Atenção &amp; Dívida Técnica Resolvida
              </h2>
              <p className="text-slate-500">
                Auditoria de segurança, pontos de fragilidade identificados no legado e como foram corrigidos nesta arquitetura.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-rose-900 font-bold">1. Vazamento de Client ID e Client Secret em Texto Aberto</strong>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Resolvido</span>
                </div>
                <p className="text-rose-800 text-xs">
                  <strong>Legado:</strong> A rota <code className="font-mono">GET /api/admin/settings</code> devolvia as chaves mestras e segredos do Bling em texto claro.<br/>
                  <strong>Correção:</strong> A rota agora mascara todos os segredos com caracteres <code className="font-mono">••••••••</code> e restringe a revelação exclusiva para o perfil Root sob autenticação reforçada.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-rose-900 font-bold">2. Transportadoras em Texto Livre</strong>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Resolvido</span>
                </div>
                <p className="text-rose-800 text-xs">
                  <strong>Legado:</strong> Usuários digitavam nomes aleatórios de transportadoras causando inconsistência fiscal e de rastreio.<br/>
                  <strong>Correção:</strong> Tabela relacional normalizada com chave estrangeira <code className="font-mono">transportadora_id</code>, CNPJ e templates oficiais de URL.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-rose-900 font-bold">3. Polling Infinito no Dashboard Não Parava ao Sair da Tela</strong>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Resolvido</span>
                </div>
                <p className="text-rose-800 text-xs">
                  <strong>Legado:</strong> O timer de polling continuava rodando em segundo plano acumulando requisições na CPU e na API.<br/>
                  <strong>Correção:</strong> Implementado gerenciador de polling com cleanup no hook de desmontagem (<code className="font-mono">useEffect return clearInterval</code>).
                </p>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-rose-900 font-bold">4. Ausência de Proteção Contra Força Bruta (Brute-Force)</strong>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Resolvido</span>
                </div>
                <p className="text-rose-800 text-xs">
                  <strong>Legado:</strong> Tentativas infinitas de login sem bloqueio.<br/>
                  <strong>Correção:</strong> Trava automática de 30 segundos após 3 tentativas falhas consecutivas, com verificação case-insensitive e opção de desbloqueio administrativo via Root.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-rose-900 font-bold">5. JSON Guardado como Texto Puro</strong>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Resolvido</span>
                </div>
                <p className="text-rose-800 text-xs">
                  <strong>Legado:</strong> Itens e medidas eram armazenados em strings concatenadas dificultando consultas de estoque.<br/>
                  <strong>Correção:</strong> Normalização com tabelas dedicadas <code className="font-mono">pedidos_vendas_itens</code> e campos tipados para dimensões e cubagem calculada.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
