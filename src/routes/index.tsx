import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Beer,
  ShoppingBag,
  Clock,
  CheckCircle2,
  DollarSign,
  Boxes,
  Plus,
  ChefHat,
  Receipt,
  AlertTriangle,
  RefreshCw,
  User
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

// Tipos do Dominio
type StatusMesa = 'livre' | 'ocupada' | 'pagamento';
type CategoriaItem = 'bebidas' | 'pratos' | 'petiscos' | 'sobremesas';
type StatusPedido = 'pendente' | 'em_preparo' | 'pronto' | 'entregue';

interface ItemCardapio {
  id: string;
  nome: string;
  categoria: CategoriaItem;
  preco: number;
  estoque: number;
  destino: 'cozinha' | 'bar';
}

interface ItemPedido {
  itemId: string;
  nome: string;
  preco: number;
  quantidade: number;
  destino: 'cozinha' | 'bar';
}

interface Pedido {
  id: string;
  mesaId: number;
  comandaNome: string;
  itens: ItemPedido[];
  status: StatusPedido;
  horario: string;
  total: number;
}

interface Mesa {
  id: number;
  numero: number;
  status: StatusMesa;
  comandaCliente?: string;
  pedidos: Pedido[];
}

export function Dashboard() {
  const [aba, setAba] = useState<'mesas' | 'cardapio' | 'kds' | 'caixa' | 'estoque'>('mesas');
  
  // Estoque & Cardápio Inicial
  const [cardapio, setCardapio] = useState<ItemCardapio[]>([
    { id: '1', nome: 'Cerveja Artesanal 500ml', categoria: 'bebidas', preco: 18.00, estoque: 45, destino: 'bar' },
    { id: '2', nome: 'Caipirinha Tradicional', categoria: 'bebidas', preco: 22.00, estoque: 30, destino: 'bar' },
    { id: '3', nome: 'Hambúrguer Gourmet c/ Fritas', categoria: 'pratos', preco: 38.00, estoque: 20, destino: 'cozinha' },
    { id: '4', nome: 'Porção de Picanha na Chapa', categoria: 'petiscos', preco: 79.00, estoque: 12, destino: 'cozinha' },
    { id: '5', nome: 'Batata Frita Turbinada', categoria: 'petiscos', preco: 29.00, estoque: 25, destino: 'cozinha' },
    { id: '6', nome: 'Pudim de Leite Condensado', categoria: 'sobremesas', preco: 14.00, estoque: 15, destino: 'cozinha' },
  ]);

  // Mesas Inicial
  const [mesas, setMesas] = useState<Mesa[]>([
    { id: 1, numero: 1, status: 'ocupada', comandaCliente: 'Carlos Silva', pedidos: [] },
    { id: 2, numero: 2, status: 'livre', pedidos: [] },
    { id: 3, numero: 3, status: 'ocupada', comandaCliente: 'Mesa Aniversário', pedidos: [] },
    { id: 4, numero: 4, status: 'pagamento', comandaCliente: 'Mariana Lima', pedidos: [] },
    { id: 5, numero: 5, status: 'livre', pedidos: [] },
    { id: 6, numero: 6, status: 'livre', pedidos: [] },
  ]);

  // Fila de Pedidos para Produção (KDS)
  const [pedidosProducao, setPedidosProducao] = useState<Pedido[]>([
    {
      id: 'PED-101',
      mesaId: 1,
      comandaNome: 'Carlos Silva',
      itens: [
        { itemId: '3', nome: 'Hambúrguer Gourmet c/ Fritas', preco: 38.00, quantidade: 2, destino: 'cozinha' },
        { itemId: '1', nome: 'Cerveja Artesanal 500ml', preco: 18.00, quantidade: 2, destino: 'bar' }
      ],
      status: 'em_preparo',
      horario: '19:42',
      total: 112.00
    },
    {
      id: 'PED-102',
      mesaId: 3,
      comandaNome: 'Mesa Aniversário',
      itens: [
        { itemId: '4', nome: 'Porção de Picanha na Chapa', preco: 79.00, quantidade: 1, destino: 'cozinha' },
        { itemId: '2', nome: 'Caipirinha Tradicional', preco: 22.00, quantidade: 3, destino: 'bar' }
      ],
      status: 'pendente',
      horario: '19:50',
      total: 145.00
    }
  ]);

  // Seleções ativas para formulários e ações
  const [mesaSelecionadaId, setMesaSelecionadaId] = useState<number | null>(1);
  const [itensNovoPedido, setItensNovoPedido] = useState<{ item: ItemCardapio; quantidade: number }[]>([]);
  const [filtroKds, setFiltroKds] = useState<'todos' | 'cozinha' | 'bar'>('todos');
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  const exibirNotificacao = (msg: string) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(''), 4000);
  };

  // --- AÇÕES DO CICLO COMPLETO ---

  // 1. ABRIR MESA OU ALTERAR NOME
  const abrirMesa = (mesaId: number, nomeCliente: string) => {
    setMesas(prev => prev.map(m => {
      if (m.id === mesaId) {
        return { ...m, status: 'ocupada', comandaCliente: nomeCliente || `Mesa ${mesaId}` };
      }
      return m;
    }));
    exibirNotificacao(`Mesa ${mesaId} aberta com sucesso para ${nomeCliente || 'Cliente'}!`);
  };

  // 2. ADICIONAR ITEM AO CARRINHO DO PEDIDO
  const adicionarAoCarrinho = (item: ItemCardapio) => {
    if (item.estoque <= 0) {
      alert('Item sem estoque disponível!');
      return;
    }
    setItensNovoPedido(prev => {
      const existe = prev.find(i => i.item.id === item.id);
      if (existe) {
        if (existe.quantidade >= item.estoque) {
          alert('Quantidade limite do estoque atingida!');
          return prev;
        }
        return prev.map(i => i.item.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { item, quantidade: 1 }];
    });
  };

  // 3. CONFIRMAR PEDIDO E ENVIAR PARA KDS + BAixar ESTOQUE
  const enviarPedido = () => {
    if (!mesaSelecionadaId) {
      alert('Selecione uma mesa!');
      return;
    }
    if (itensNovoPedido.length === 0) {
      alert('Adicione itens ao pedido!');
      return;
    }

    const mesa = mesas.find(m => m.id === mesaSelecionadaId);
    const novoId = `PED-${Math.floor(100 + Math.random() * 900)}`;
    const totalCalculado = itensNovoPedido.reduce((acc, curr) => acc + (curr.item.preco * curr.quantidade), 0);

    const novoPedido: Pedido = {
      id: novoId,
      mesaId: mesaSelecionadaId,
      comandaNome: mesa?.comandaCliente || `Mesa ${mesaSelecionadaId}`,
      itens: itensNovoPedido.map(i => ({
        itemId: i.item.id,
        nome: i.item.nome,
        preco: i.item.preco,
        quantidade: i.quantidade,
        destino: i.item.destino
      })),
      status: 'pendente',
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total: totalCalculado
    };

    // Atualiza KDS
    setPedidosProducao(prev => [novoPedido, ...prev]);

    // Baixa de Estoque Dinâmica
    setCardapio(prev => prev.map(prod => {
      const itemPedido = itensNovoPedido.find(i => i.item.id === prod.id);
      if (itemPedido) {
        return { ...prod, estoque: prod.estoque - itemPedido.quantidade };
      }
      return prod;
    }));

    // Associa pedido à Mesa
    setMesas(prev => prev.map(m => {
      if (m.id === mesaSelecionadaId) {
        return {
          ...m,
          status: 'ocupada',
          pedidos: [...m.pedidos, novoPedido]
        };
      }
      return m;
    }));

    setItensNovoPedido([]);
    exibirNotificacao(`Pedido ${novoId} enviado para a produção e estoque atualizado!`);
  };

  // 4. MUDAR STATUS NO KDS (Bar / Cozinha)
  const atualizarStatusPedido = (pedidoId: string, novoStatus: StatusPedido) => {
    setPedidosProducao(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
    exibirNotificacao(`Status do pedido ${pedidoId} alterado para: ${novoStatus.replace('_', ' ').toUpperCase()}`);
  };

  // 5. FECHAR CONTA E REALIZAR PAGAMENTO
  const realizarPagamento = (mesaId: number, formaPagamento: string, aplicarDezPorcento: boolean) => {
    const mesa = mesas.find(m => m.id === mesaId);
    if (!mesa) return;

    // Junta pedidos da mesa no KDS e local
    const todosPedidos = [...mesa.pedidos, ...pedidosProducao.filter(p => p.mesaId === mesaId)];
    const subtotal = todosPedidos.reduce((acc, p) => acc + p.total, 0);
    const taxa = aplicarDezPorcento ? subtotal * 0.10 : 0;
    const totalComTaxa = subtotal + taxa;

    // Reseta Mesa para livre
    setMesas(prev => prev.map(m => {
      if (m.id === mesaId) {
        return {
          ...m,
          status: 'livre',
          comandaCliente: undefined,
          pedidos: []
        };
      }
      return m;
    }));

    // Remove pedidos da produção finalizados
    setPedidosProducao(prev => prev.filter(p => p.mesaId !== mesaId));

    exibirNotificacao(`Pagamento de R$ ${totalComTaxa.toFixed(2)} (${formaPagamento}) concluído! Mesa ${mesaId} liberada.`);
  };

  // Reabastecer Estoque
  const reabastecerItem = (itemId: string, qtd: number) => {
    setCardapio(prev => prev.map(item => item.id === itemId ? { ...item, estoque: item.estoque + qtd } : item));
    exibirNotificacao(`Estoque reabastecido com sucesso!`);
  };

  const mesaAtualObj = mesas.find(m => m.id === mesaSelecionadaId);
  const pedidosDaMesaAtual = [
    ...(mesaAtualObj?.pedidos || []),
    ...pedidosProducao.filter(p => p.mesaId === mesaSelecionadaId)
  ];
  const subtotalMesaAtual = pedidosDaMesaAtual.reduce((acc, p) => acc + p.total, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header / Topbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/30">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">GastrôControl POS</h1>
            <p className="text-xs text-slate-400">Gestão de Mesas, Produção (KDS), Caixa e Estoque</p>
          </div>
        </div>

        {/* Abas de Navegação */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setAba('mesas')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              aba === 'mesas' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Mesas & Comandas
          </button>
          <button
            onClick={() => setAba('cardapio')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              aba === 'cardapio' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            Novo Pedido
          </button>
          <button
            onClick={() => setAba('kds')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all relative ${
              aba === 'kds' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Produção (KDS)
            {pedidosProducao.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pedidosProducao.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAba('caixa')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              aba === 'caixa' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Caixa & Fechamento
          </button>
          <button
            onClick={() => setAba('estoque')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              aba === 'estoque' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Estoque
          </button>
        </nav>
      </header>

      {/* Notificação Toast */}
      {mensagemSucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-3 text-sm flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {mensagemSucesso}
          </span>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {/* ABA 1: MESAS & COMANDAS */}
        {aba === 'mesas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Visão Geral do Salão</h2>
                <p className="text-sm text-slate-400">Acompanhe a ocupação e acesse a comanda de cada mesa</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Livre
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Ocupada
                </span>
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Em Pagamento
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {mesas.map((mesa) => {
                const totalMesa = pedidosProducao
                  .filter(p => p.mesaId === mesa.id)
                  .reduce((sum, p) => sum + p.total, 0);

                return (
                  <div
                    key={mesa.id}
                    className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                      mesa.status === 'livre'
                        ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50'
                        : mesa.status === 'ocupada'
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-white">Mesa {mesa.numero}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                          mesa.status === 'livre'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : mesa.status === 'ocupada'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}>
                          {mesa.status === 'livre' ? 'LIVRE' : mesa.status === 'ocupada' ? 'OCUPADA' : 'FECHANDO'}
                        </span>
                      </div>

                      {mesa.status !== 'livre' ? (
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-slate-300 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            {mesa.comandaCliente || 'Cliente sem nome'}
                          </p>
                          <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" />
                            Total: R$ {totalMesa.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mb-4">Mesa pronta para receber clientes</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                      {mesa.status === 'livre' ? (
                        <button
                          onClick={() => {
                            const nome = prompt('Nome para a comanda da Mesa ' + mesa.numero + ':');
                            abrirMesa(mesa.id, nome || '');
                          }}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Open Table / Abrir Comanda
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setMesaSelecionadaId(mesa.id);
                              setAba('cardapio');
                            }}
                            className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Pedido
                          </button>
                          <button
                            onClick={() => {
                              setMesaSelecionadaId(mesa.id);
                              setAba('caixa');
                            }}
                            className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" /> Fechar & Pagar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 2: NOVO PEDIDO & CARDÁPIO */}
        {aba === 'cardapio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Catálogo de Produtos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Lançamento de Pedidos</h2>
                  <p className="text-sm text-slate-400">Selecione os itens do cardápio para enviar à cozinha ou bar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cardapio.map(item => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-white text-base">{item.nome}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          item.destino === 'bar'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}>
                          {item.destino}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-emerald-400 mb-3">R$ {item.preco.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span className={`flex items-center gap-1.5 font-medium ${
                        item.estoque < 5 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        <Boxes className="w-3.5 h-3.5" /> Estoque: {item.estoque} un
                      </span>
                      <button
                        onClick={() => adicionarAoCarrinho(item)}
                        disabled={item.estoque <= 0}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo do Pedido Atual */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-fit space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Resumo da Comanda</h3>
                <div className="mb-4">
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Mesa de Destino:</label>
                  <select
                    value={mesaSelecionadaId || ''}
                    onChange={(e) => setMesaSelecionadaId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Selecione uma mesa</option>
                    {mesas.map(m => (
                      <option key={m.id} value={m.id}>
                        Mesa {m.numero} {m.comandaCliente ? `(${m.comandaCliente})` : '(Livre)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 border-t border-b border-slate-800 py-4 max-h-60 overflow-y-auto">
                  {itensNovoPedido.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-6">Nenhum item adicionado ao pedido</p>
                  ) : (
                    itensNovoPedido.map(({ item, quantidade }) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-slate-200">{item.nome}</p>
                          <p className="text-xs text-slate-400">{quantidade}x R$ {item.preco.toFixed(2)}</p>
                        </div>
                        <p className="font-semibold text-white">R$ {(item.preco * quantidade).toFixed(2)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-white">
                  <span>Total do Pedido:</span>
                  <span className="text-emerald-400 text-base">
                    R$ {itensNovoPedido.reduce((acc, curr) => acc + (curr.item.preco * curr.quantidade), 0).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={enviarPedido}
                  disabled={itensNovoPedido.length === 0 || !mesaSelecionadaId}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ChefHat className="w-4 h-4" /> Enviar para Cozinha/Bar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PRODUÇÃO (KDS - KITCHEN DISPLAY SYSTEM) */}
        {aba === 'kds' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Fila de Produção (KDS)</h2>
                <p className="text-sm text-slate-400">Acompanhe o preparo dos pedidos em tempo real na cozinha e no bar</p>
              </div>

              {/* Filtro Cozinha / Bar */}
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setFiltroKds('todos')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filtroKds === 'todos' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFiltroKds('cozinha')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filtroKds === 'cozinha' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Cozinha
                </button>
                <button
                  onClick={() => setFiltroKds('bar')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filtroKds === 'bar' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Bar
                </button>
              </div>
            </div>

            {pedidosProducao.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-bold text-white">Nenhum pedido pendente!</h3>
                <p className="text-slate-400 text-sm">Todos os pedidos já foram preparados e entregues.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pedidosProducao.map((pedido) => {
                  const itensFiltrados = filtroKds === 'todos'
                    ? pedido.itens
                    : pedido.itens.filter(i => i.destino === filtroKds);

                  if (itensFiltrados.length === 0) return null;

                  return (
                    <div
                      key={pedido.id}
                      className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl ${
                        pedido.status === 'pendente'
                          ? 'border-amber-500/50'
                          : pedido.status === 'em_preparo'
                          ? 'border-indigo-500/50'
                          : 'border-emerald-500/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                          <div>
                            <span className="font-bold text-white text-base">Mesa {pedido.mesaId}</span>
                            <span className="text-xs text-slate-400 block">{pedido.comandaNome}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" /> {pedido.horario}
                            </span>
                            <span className="text-xs font-mono font-semibold text-indigo-400">{pedido.id}</span>
                          </div>
                        </div>

                        {/* Lista de Itens do Pedido */}
                        <div className="space-y-2 mb-4">
                          {itensFiltrados.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between text-sm bg-slate-950 p-2 rounded-lg border border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-400 text-base">{item.quantidade}x</span>
                                <span className="text-slate-200 font-medium">{item.nome}</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {item.destino}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ações de Avanço de Status */}
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Status:</span>
                          <span className="font-bold uppercase text-indigo-400">{pedido.status.replace('_', ' ')}</span>
                        </div>

                        {pedido.status === 'pendente' && (
                          <button
                            onClick={() => atualizarStatusPedido(pedido.id, 'em_preparo')}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" /> Iniciar Preparo
                          </button>
                        )}
                        {pedido.status === 'em_preparo' && (
                          <button
                            onClick={() => atualizarStatusPedido(pedido.id, 'pronto')}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Pronto
                          </button>
                        )}
                        {pedido.status === 'pronto' && (
                          <button
                            onClick={() => atualizarStatusPedido(pedido.id, 'entregue')}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Concluir / Entregue
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA 4: CAIXA & FECHAMENTO */}
        {aba === 'caixa' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Fechamento de Conta & Pagamento</h2>
              <p className="text-sm text-slate-400">Consolide os consumos, aplique taxa de serviço e libere a mesa</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Selecione a Mesa para Encerrar:</label>
                <select
                  value={mesaSelecionadaId || ''}
                  onChange={(e) => setMesaSelecionadaId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {mesas.filter(m => m.status !== 'livre').map(m => (
                    <option key={m.id} value={m.id}>
                      Mesa {m.numero} - {m.comandaCliente || 'Sem Nome'}
                    </option>
                  ))}
                </select>
              </div>

              {mesaAtualObj && (pedidosDaMesaAtual.length > 0) ? (
                <div className="space-y-4">
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-2 flex items-center justify-between">
                      <span>Extrato de Consumo - Mesa {mesaAtualObj.numero} ({mesaAtualObj.comandaCliente})</span>
                      <Receipt className="w-4 h-4 text-slate-400" />
                    </h3>

                    <div className="space-y-2 max-h-48 overflow-y-auto text-sm pr-2">
                      {pedidosDaMesaAtual.map(ped => (
                        <div key={ped.id} className="space-y-1">
                          {ped.itens.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-slate-300 text-xs">
                              <span>{it.quantidade}x {it.nome}</span>
                              <span>R$ {(it.preco * it.quantidade).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Subtotal do Consumo:</span>
                        <span className="text-slate-200 font-semibold">R$ {subtotalMesaAtual.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Taxa de Serviço (10% sugerida):</span>
                        <span className="text-emerald-400 font-semibold">R$ {(subtotalMesaAtual * 0.10).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                        <span>Total a Pagar:</span>
                        <span className="text-emerald-400">R$ {(subtotalMesaAtual * 1.10).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Opções de Forma de Pagamento */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs text-slate-400 block font-semibold">Escolha a Forma de Pagamento:</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => realizarPagamento(mesaAtualObj.id, 'PIX', true)}
                        className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
                      >
                        <DollarSign className="w-4 h-4" /> PIX
                      </button>
                      <button
                        onClick={() => realizarPagamento(mesaAtualObj.id, 'Cartão de Crédito/Débito', true)}
                        className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
                      >
                        <Receipt className="w-4 h-4" /> Cartão
                      </button>
                      <button
                        onClick={() => realizarPagamento(mesaAtualObj.id, 'Dinheiro', true)}
                        className="py-3 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-600/20"
                      >
                        <DollarSign className="w-4 h-4" /> Dinheiro
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center text-sm py-8">
                  Selecione uma mesa ocupada para visualizar o extrato e realizar o pagamento.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ABA 5: GESTÃO DE ESTOQUE */}
        {aba === 'estoque' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Controle de Estoque</h2>
                <p className="text-sm text-slate-400">Acompanhe as baixas automáticas feitas em cada pedido</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Produto / Insumo</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Preço Unit.</th>
                    <th className="p-4">Qtd em Estoque</th>
                    <th className="p-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cardapio.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-semibold text-white flex items-center gap-2">
                        {item.nome}
                        {item.estoque <= 5 && (
                          <span className="flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                            <AlertTriangle className="w-3 h-3" /> Baixo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 capitalize">{item.categoria}</td>
                      <td className="p-4 text-emerald-400 font-mono font-medium">R$ {item.preco.toFixed(2)}</td>
                      <td className="p-4 font-bold">
                        <span className={item.estoque <= 5 ? 'text-rose-400' : 'text-slate-200'}>
                          {item.estoque} unidades
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => reabastecerItem(item.id, 10)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 rounded-lg font-semibold flex items-center justify-center gap-1.5 mx-auto border border-slate-700 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" /> +10 Unidades
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
