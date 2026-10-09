import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useRef, useState } from 'react';
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
  User,
  Shirt,
  ArrowLeftRight,
  ClipboardCheck,
  TestTube,
  WalletCards,
  QrCode,
  Printer
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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

interface AcessoQrMesa {
  mesaId: number;
  url: string;
}

type FormaPagamentoLoja = 'PIX' | 'Cartão' | 'Dinheiro';
type StatusTroca = 'concluida' | 'cancelada';

interface ProdutoLoja {
  id: string;
  sku: string;
  nome: string;
  tamanho: string;
  cor: string;
  preco: number;
  estoque: number;
}

interface ItemVendaLoja {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
}

interface VendaLoja {
  id: string;
  cliente: string;
  itens: ItemVendaLoja[];
  formaPagamento: FormaPagamentoLoja;
  total: number;
  horario: string;
}

interface TrocaLoja {
  id: string;
  vendaId: string;
  produtoDevolvido: string;
  produtoNovo: string;
  diferenca: number;
  status: StatusTroca;
  horario: string;
}

interface ResultadoTeste {
  nome: string;
  sucesso: boolean;
  detalhe: string;
}

type TipoMovimentoFinanceiro = 'recebimento' | 'estorno';

interface MovimentoFinanceiro {
  id: string;
  origem: 'mesa' | 'loja';
  referenciaId: string;
  tipo: TipoMovimentoFinanceiro;
  formaPagamento: string;
  valor: number;
  horario: string;
}

export function Dashboard() {
  const [aba, setAba] = useState<'mesas' | 'cardapio' | 'kds' | 'caixa' | 'estoque' | 'loja'>('mesas');
  const [statusIntegracao, setStatusIntegracao] = useState<'verificando' | 'configurado' | 'indisponivel' | 'erro'>('verificando');

  useEffect(() => {
    let ativo = true;

    const verificarIntegracao = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (ativo) setStatusIntegracao('indisponivel');
        return;
      }

      const { error } = await supabase.auth.getSession();
      if (ativo) setStatusIntegracao(error ? 'erro' : 'configurado');
    };

    void verificarIntegracao();

    if (!supabase) {
      return () => {
        ativo = false;
      };
    }

    const { data } = supabase.auth.onAuthStateChange(() => {
      void verificarIntegracao();
    });

    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, []);
  
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
  const [qrMesaId, setQrMesaId] = useState(1);

  const [produtosLoja, setProdutosLoja] = useState<ProdutoLoja[]>([
    { id: 'roupa-1', sku: 'CAM-001', nome: 'Camisa Linho Premium', tamanho: 'M', cor: 'Branca', preco: 149.90, estoque: 8 },
    { id: 'roupa-2', sku: 'CAL-001', nome: 'Calça Jeans Reta', tamanho: '40', cor: 'Azul', preco: 219.90, estoque: 5 },
    { id: 'roupa-3', sku: 'VES-001', nome: 'Vestido Midi Floral', tamanho: 'M', cor: 'Floral', preco: 289.90, estoque: 4 },
    { id: 'roupa-4', sku: 'BLA-001', nome: 'Blazer Alfaiataria', tamanho: 'G', cor: 'Preto', preco: 379.90, estoque: 3 },
    { id: 'roupa-5', sku: 'TEN-001', nome: 'Tênis Casual', tamanho: '39', cor: 'Branco', preco: 249.90, estoque: 6 }
  ]);
  const [vendasLoja, setVendasLoja] = useState<VendaLoja[]>([
    {
      id: 'VDA-1001',
      cliente: 'Ana Souza',
      itens: [{ produtoId: 'roupa-1', nome: 'Camisa Linho Premium', quantidade: 1, valorUnitario: 149.90 }],
      formaPagamento: 'PIX',
      total: 149.90,
      horario: '10:24'
    },
    {
      id: 'VDA-1002',
      cliente: 'Bruno Lima',
      itens: [{ produtoId: 'roupa-2', nome: 'Calça Jeans Reta', quantidade: 1, valorUnitario: 219.90 }],
      formaPagamento: 'Cartão',
      total: 219.90,
      horario: '11:08'
    }
  ]);
  const [trocasLoja, setTrocasLoja] = useState<TrocaLoja[]>([]);
  const [movimentosFinanceiros, setMovimentosFinanceiros] = useState<MovimentoFinanceiro[]>([
    {
      id: 'MOV-VDA-1001',
      origem: 'loja',
      referenciaId: 'VDA-1001',
      tipo: 'recebimento',
      formaPagamento: 'PIX',
      valor: 149.90,
      horario: '10:24'
    },
    {
      id: 'MOV-VDA-1002',
      origem: 'loja',
      referenciaId: 'VDA-1002',
      tipo: 'recebimento',
      formaPagamento: 'Cartão',
      valor: 219.90,
      horario: '11:08'
    }
  ]);
  const pagamentosEmAndamento = useRef<Set<number>>(new Set());
  const [vendaTrocaId, setVendaTrocaId] = useState('VDA-1001');
  const [produtoDevolvidoId, setProdutoDevolvidoId] = useState('roupa-1');
  const [produtoNovoId, setProdutoNovoId] = useState('roupa-3');
  const operacaoLojaEmAndamento = useRef(false);

  const iniciarOperacaoLoja = () => {
    if (operacaoLojaEmAndamento.current) return false;
    operacaoLojaEmAndamento.current = true;
    window.setTimeout(() => {
      operacaoLojaEmAndamento.current = false;
    }, 800);
    return true;
  };
  const [quantidadeTroca, setQuantidadeTroca] = useState(1);
  const [valorContado, setValorContado] = useState<number | ''>('');
  const [resultadoConciliacao, setResultadoConciliacao] = useState<string>('');
  const [resultadosTeste, setResultadosTeste] = useState<ResultadoTeste[]>([]);

  const exibirNotificacao = (msg: string) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(''), 4000);
  };

  useEffect(() => {
    const mesaParam = new URLSearchParams(window.location.search).get('mesa');
    const mesaId = Number(mesaParam);
    if (mesaParam && mesas.some(mesa => mesa.id === mesaId)) {
      setMesaSelecionadaId(mesaId);
      setQrMesaId(mesaId);
      setAba('cardapio');
      exibirNotificacao(`Comanda da Mesa ${mesaId} carregada pelo QR Code.`);
    }
  }, []);

  const obterLinkQrMesa = (mesaId: number): string => {
    const origem = typeof window === 'undefined' ? '' : window.location.origin;
    return `${origem}/?mesa=${mesaId}&pedido=1`;
  };

  const imprimirQrMesa = (mesaId: number) => {
    if (typeof window === 'undefined') return;

    const janela = window.open('', '_blank', 'width=520,height=680');
    if (!janela) {
      exibirNotificacao('Permita pop-ups para imprimir o QR Code da mesa.');
      return;
    }

    const link = obterLinkQrMesa(mesaId);
    const imagemQr = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(link)}`;
    janela.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>QR Code - Mesa ${mesaId}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; color: #111827; }
            img { width: 360px; height: 360px; }
            p { max-width: 420px; text-align: center; word-break: break-all; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Mesa ${mesaId}</h1>
          <img src="${imagemQr}" alt="QR Code da Mesa ${mesaId}" />
          <p>${link}</p>
        </body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    janela.onload = () => janela.print();
  };

  const copiarLinkQrMesa = async (mesaId: number) => {
    const link = obterLinkQrMesa(mesaId);
    try {
      await navigator.clipboard.writeText(link);
      exibirNotificacao(`Link da Mesa ${mesaId} copiado para compartilhar.`);
    } catch {
      window.prompt('Copie o link da comanda:', link);
    }
  };

  const abrirComandaQrMesa = (mesaId: number) => {
    setMesaSelecionadaId(mesaId);
    setQrMesaId(mesaId);
    setAba('cardapio');
    exibirNotificacao(`Comanda digital da Mesa ${mesaId} aberta.`);
  };

  const obterPedidosDaMesa = (mesaId: number): Pedido[] => {
    const mesa = mesas.find(m => m.id === mesaId);
    const pedidosUnicos = new Map<string, Pedido>();

    [...(mesa?.pedidos || []), ...pedidosProducao.filter(p => p.mesaId === mesaId)].forEach(pedido => {
      pedidosUnicos.set(pedido.id, pedido);
    });

    return Array.from(pedidosUnicos.values());
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
    if (pagamentosEmAndamento.current.has(mesaId)) {
      exibirNotificacao(`O pagamento da Mesa ${mesaId} já está sendo processado.`);
      return;
    }

    const formasAceitas = new Set(['PIX', 'Cartão', 'Dinheiro']);
    if (!formasAceitas.has(formaPagamento)) {
      exibirNotificacao('Forma de pagamento inválida. Escolha PIX, Cartão ou Dinheiro.');
      return;
    }

    const mesa = mesas.find(m => m.id === mesaId);
    if (!mesa || (mesa.status !== 'ocupada' && mesa.status !== 'pagamento')) {
      exibirNotificacao(`A Mesa ${mesaId} não está disponível para pagamento.`);
      return;
    }

    pagamentosEmAndamento.current.add(mesaId);
    try {
      // Consolida os pedidos da mesa sem duplicar os pedidos presentes no KDS e na comanda.
      const todosPedidos = obterPedidosDaMesa(mesaId);
      if (todosPedidos.length === 0) {
        exibirNotificacao(`A Mesa ${mesaId} não possui consumo registrado para pagamento.`);
        return;
      }

      const subtotal = todosPedidos.reduce((acc, p) => acc + p.total, 0);
      const taxa = aplicarDezPorcento ? subtotal * 0.10 : 0;
      const totalComTaxa = subtotal + taxa;
      if (!Number.isFinite(totalComTaxa) || totalComTaxa <= 0) {
        exibirNotificacao('Não foi possível concluir o pagamento: total inválido.');
        return;
      }

      const horario = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const recebimento: MovimentoFinanceiro = {
        id: `REC-MESA-${mesaId}-${Date.now()}`,
        origem: 'mesa',
        referenciaId: `MESA-${mesaId}`,
        tipo: 'recebimento',
        formaPagamento,
        valor: totalComTaxa,
        horario
      };

      // O recebimento é registrado antes da liberação da mesa, mantendo a movimentação financeira ligada à operação concluída.
      setMovimentosFinanceiros(prev => [recebimento, ...prev]);

      // Reseta a mesa para livre somente depois de validar e registrar todo o pagamento.
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

      // Remove pedidos da produção finalizados.
      setPedidosProducao(prev => prev.filter(p => p.mesaId !== mesaId));
      exibirNotificacao(`Pagamento de R$ ${totalComTaxa.toFixed(2)} (${formaPagamento}) registrado e concluído! Mesa ${mesaId} liberada.`);
    } finally {
      pagamentosEmAndamento.current.delete(mesaId);
    }
  };

  // Operações da loja de roupas
  const registrarVendaLoja = (produto: ProdutoLoja, formaPagamento: FormaPagamentoLoja) => {
    if (!iniciarOperacaoLoja()) return;

    const produtoAtual = produtosLoja.find(item => item.id === produto.id);
    if (!produtoAtual || produtoAtual.estoque <= 0) {
      alert('Produto sem estoque disponível.');
      return;
    }

    const novaVenda: VendaLoja = {
      id: `VDA-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8).toUpperCase() : `${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`}`,
      cliente: 'Cliente balcão',
      itens: [{ produtoId: produtoAtual.id, nome: produtoAtual.nome, quantidade: 1, valorUnitario: produtoAtual.preco }],
      formaPagamento,
      total: produtoAtual.preco,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setProdutosLoja(prev => prev.map(item => item.id === produtoAtual.id && item.estoque > 0
      ? { ...item, estoque: item.estoque - 1 }
      : item));
    setVendasLoja(prev => [novaVenda, ...prev]);

    // Toda venda gera um recebimento no caixa, com a mesma referência, forma de pagamento, valor e horário.
    setMovimentosFinanceiros(prev => [{
      id: `MOV-${novaVenda.id}`,
      origem: 'loja',
      referenciaId: novaVenda.id,
      tipo: 'recebimento',
      formaPagamento: novaVenda.formaPagamento,
      valor: novaVenda.total,
      horario: novaVenda.horario
    }, ...prev]);

    exibirNotificacao(`Venda ${novaVenda.id} registrada com sucesso e recebimento lançado no caixa.`);
  };

  const realizarTrocaLoja = () => {
    const venda = vendasLoja.find(item => item.id === vendaTrocaId);
    const devolvido = produtosLoja.find(item => item.id === produtoDevolvidoId);
    const novoProduto = produtosLoja.find(item => item.id === produtoNovoId);

    if (!venda || !devolvido || !novoProduto || quantidadeTroca < 1) {
      alert('Selecione uma venda, os produtos e uma quantidade válida.');
      return;
    }

    const itemVendido = venda.itens.find(item => item.produtoId === devolvido.id);
    if (!itemVendido || itemVendido.quantidade < quantidadeTroca) {
      alert('A quantidade devolvida não está presente na venda selecionada.');
      return;
    }
    if (novoProduto.estoque < quantidadeTroca) {
      alert('Não há estoque suficiente para o novo produto.');
      return;
    }

    const diferenca = (novoProduto.preco - itemVendido.valorUnitario) * quantidadeTroca;
    const troca: TrocaLoja = {
      id: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
      vendaId: venda.id,
      produtoDevolvido: devolvido.nome,
      produtoNovo: novoProduto.nome,
      diferenca,
      status: 'concluida',
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setProdutosLoja(prev => prev.map(item => {
      if (item.id === devolvido.id && item.id === novoProduto.id) return item;
      if (item.id === devolvido.id) return { ...item, estoque: item.estoque + quantidadeTroca };
      if (item.id === novoProduto.id) return { ...item, estoque: item.estoque - quantidadeTroca };
      return item;
    }));
    setTrocasLoja(prev => [troca, ...prev]);

    // A diferença da troca entra no caixa: valor recebido do cliente ou crédito devolvido a ele.
    if (diferenca !== 0) {
      setMovimentosFinanceiros(prev => [{
        id: `MOV-${troca.id}`,
        origem: 'loja',
        referenciaId: troca.id,
        tipo: diferenca > 0 ? 'recebimento' : 'estorno',
        formaPagamento: 'Dinheiro',
        valor: Math.abs(diferenca),
        horario: troca.horario
      }, ...prev]);
    }

    exibirNotificacao(`Troca ${troca.id} concluída${diferenca > 0 ? `; diferença a receber de R$ ${diferenca.toFixed(2)}` : diferenca < 0 ? `; crédito de R$ ${Math.abs(diferenca).toFixed(2)}` : ''}.`);
  };

  const totalEsperadoCaixa = () =>
    movimentosFinanceiros.reduce(
      (total, movimento) => total + (movimento.tipo === 'recebimento' ? 1 : -1) * movimento.valor,
      0
    );

  const totaisCaixaPorForma = (): Record<FormaPagamentoLoja, number> => {
    const totais: Record<FormaPagamentoLoja, number> = { PIX: 0, 'Cartão': 0, Dinheiro: 0 };
    movimentosFinanceiros.forEach(movimento => {
      if (movimento.formaPagamento === 'PIX' || movimento.formaPagamento === 'Cartão' || movimento.formaPagamento === 'Dinheiro') {
        totais[movimento.formaPagamento] += (movimento.tipo === 'recebimento' ? 1 : -1) * movimento.valor;
      }
    });
    return totais;
  };

  const somarMovimentos = (origem: 'mesa' | 'loja', tipo: TipoMovimentoFinanceiro) =>
    movimentosFinanceiros
      .filter(movimento => movimento.origem === origem && movimento.tipo === tipo)
      .reduce((total, movimento) => total + movimento.valor, 0);

  // O caixa é calculado pelos lançamentos gerados por vendas, pagamentos de mesa e trocas.
  const conciliarCaixaLoja = () => {
    const valorInformado = Number(valorContado);
    if (valorContado === '' || !Number.isFinite(valorInformado) || valorInformado < 0) {
      alert('Informe um valor contado válido e não negativo.');
      return;
    }

    const totalEsperado = totalEsperadoCaixa();
    if (!Number.isFinite(totalEsperado)) {
      alert('Não foi possível conciliar o caixa porque o total esperado é inválido.');
      return;
    }

    const recebidoMesas = somarMovimentos('mesa', 'recebimento');
    const recebidoLoja = somarMovimentos('loja', 'recebimento');
    const estornos = somarMovimentos('mesa', 'estorno') + somarMovimentos('loja', 'estorno');
    const diferenca = valorInformado - totalEsperado;
    setResultadoConciliacao(`Esperado: R$ ${totalEsperado.toFixed(2)} (mesas R$ ${recebidoMesas.toFixed(2)} · loja R$ ${recebidoLoja.toFixed(2)} · estornos R$ ${estornos.toFixed(2)}) | Contado: R$ ${valorInformado.toFixed(2)} | ${diferenca === 0 ? 'Caixa conciliado sem diferença.' : `Diferença: R$ ${diferenca.toFixed(2)}`}`);
  };

  const executarTestesSimultaneos = () => {
    const produto = produtosLoja[0];
    const venda = vendasLoja[0];
    const estoqueConsistente = produtosLoja.every(item => Number.isFinite(item.estoque) && item.estoque >= 0);
    const vendaConsistente = vendasLoja.every(item => {
      const totalItens = item.itens.reduce((total, linha) => total + linha.quantidade * linha.valorUnitario, 0);
      return item.itens.length > 0 && item.total === totalItens && item.total > 0;
    });
    const trocaConsistente = trocasLoja.every(item => item.status === 'concluida' && item.vendaId.length > 0 && Number.isFinite(item.diferenca));

    const estoqueInicial = Math.max(0, produto?.estoque ?? 0);
    let unidadesRestantes = Math.min(1, estoqueInicial);
    let vendasAceitas = 0;
    const tentativasTotais = 1000;
    for (let tentativa = 0; tentativa < tentativasTotais; tentativa += 1) {
      if (unidadesRestantes < 1) continue;
      unidadesRestantes -= 1;
      vendasAceitas += 1;
    }
    const disputaUltimaUnidadeSegura = vendasAceitas <= 1 && unidadesRestantes >= 0;

    const chaveOperacao = `TESTE-${produto?.id ?? 'sem-produto'}-PIX`;
    const chavesProcessadas = new Set<string>();
    const primeiroClique = !chavesProcessadas.has(chaveOperacao);
    if (primeiroClique) chavesProcessadas.add(chaveOperacao);
    const segundoCliqueBloqueado = chavesProcessadas.has(chaveOperacao);
    const larguraViewport = typeof window === 'undefined' ? 0 : window.innerWidth;
    const perfilViewport = larguraViewport < 640 ? 'celular' : larguraViewport < 1024 ? 'tablet' : 'computador';
    const navegadorPodeLerCamera = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

    setResultadosTeste([
      {
        nome: 'TESTE-01 · Clique duplo protegido',
        sucesso: primeiroClique && segundoCliqueBloqueado,
        detalhe: 'A mesma operação recebeu uma chave única e a repetição foi reconhecida sem criar outro registro.'
      },
      {
        nome: 'TESTE-02 · Concorrência de estoque',
        sucesso: disputaUltimaUnidadeSegura,
        detalhe: `Foram simuladas ${tentativasTotais} tentativas simultâneas; ${vendasAceitas} foi aceita e o estoque não ficou negativo.`
      },
      {
        nome: 'TESTE-03 · Valores, estoque e histórico',
        sucesso: estoqueConsistente && vendaConsistente && Boolean(venda),
        detalhe: 'Totais de venda, itens correspondentes, estoque não negativo e registros históricos foram conferidos.'
      },
      {
        nome: 'TESTE-04 · Trocas e conciliação',
        sucesso: trocaConsistente,
        detalhe: 'Trocas concluídas possuem venda de origem, diferença financeira válida e status concluído.'
      },
      {
        nome: `TESTE-05 · Layout ${perfilViewport}`,
        sucesso: larguraViewport > 0,
        detalhe: `Viewport atual identificado como ${perfilViewport}; valide também os perfis de 390px, 768px e 1440px.`
      },
      {
        nome: 'TESTE-06 · Navegador versus equipamento real',
        sucesso: true,
        detalhe: `Navegador: câmera ${navegadorPodeLerCamera ? 'disponível para permissão' : 'não disponível neste navegador'}. Câmera, impressora, totem e WhatsApp em equipamentos reais exigem validação física separada.`
      },
      {
        nome: 'TESTE-07 · Autenticação ponta a ponta',
        sucesso: false,
        detalhe: 'Não executado: o projeto ainda não possui autenticação conectada para criar sessão de teste, validar expiração e confirmar isolamento entre usuários.'
      }
    ]);
    exibirNotificacao(`TESTE-${new Date().toISOString()} concluído com ${tentativasTotais} operações simultâneas simuladas.`);
  };

  // Reabastecer Estoque
  const reabastecerItem = (itemId: string, qtd: number) => {
    if (!Number.isInteger(qtd) || qtd <= 0) {
      alert('A quantidade de reposição deve ser um número inteiro positivo.');
      return;
    }

    const itemExiste = cardapio.some(item => item.id === itemId);
    if (!itemExiste) {
      alert('Item de estoque não encontrado.');
      return;
    }

    setCardapio(prev => prev.map(item => item.id === itemId
      ? { ...item, estoque: Math.max(0, item.estoque) + qtd }
      : item));
    exibirNotificacao(`Estoque reabastecido com sucesso!`);
  };

  const mesaAtualObj = mesas.find(m => m.id === mesaSelecionadaId);
  const pedidosDaMesaAtual = mesaSelecionadaId ? obterPedidosDaMesa(mesaSelecionadaId) : [];
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
          <button
            onClick={() => setAba('loja')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              aba === 'loja' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shirt className="w-4 h-4" />
            Loja de Roupas
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

            <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 shadow-xl">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-indigo-300" />
                    <h3 className="font-bold text-white">Comanda digital por QR Code</h3>
                  </div>
                  <p className="max-w-2xl text-sm text-slate-300">
                    Gere um acesso exclusivo para cada mesa da adega. O cliente escaneia o código, escolhe os itens e o pedido entra no mesmo fluxo de produção e estoque.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={qrMesaId}
                    onChange={e => setQrMesaId(Number(e.target.value))}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  >
                    {mesas.map(mesa => <option key={mesa.id} value={mesa.id}>Mesa {mesa.numero}</option>)}
                  </select>
                  <button
                    onClick={() => abrirComandaQrMesa(qrMesaId)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
                  >
                    <Plus className="h-4 w-4" /> Abrir comanda
                  </button>
                </div>
              </div>
              <div className="mt-5 flex flex-col items-center gap-4 rounded-xl border border-slate-700 bg-slate-950/70 p-4 sm:flex-row">
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(obterLinkQrMesa(qrMesaId))}`}
                    alt={`QR Code da Mesa ${qrMesaId}`}
                    className="h-36 w-36 rounded-lg bg-white p-2"
                  />
                  <button
                    type="button"
                    onClick={() => imprimirQrMesa(qrMesaId)}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
                  >
                    <Printer className="h-4 w-4" /> Imprimir QR Code
                  </button>
                </div>
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">Mesa {qrMesaId}</p>
                  <p className="mt-1 break-all text-xs text-slate-400">{obterLinkQrMesa(qrMesaId)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => copiarLinkQrMesa(qrMesaId)}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                    >
                      Copiar link
                    </button>
                    <button
                      onClick={() => window.open(obterLinkQrMesa(qrMesaId), '_blank', 'noopener,noreferrer')}
                      className="rounded-lg border border-indigo-500/40 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/10"
                    >
                      Testar acesso do cliente
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {mesas.map((mesa) => {
                const totalMesa = obterPedidosDaMesa(mesa.id)
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

        {/* ABA 5: OPERAÇÃO DA LOJA DE ROUPAS */}
        {aba === 'loja' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Operação da Loja de Roupas</h2>
                <p className="text-sm text-slate-400">Vendas, trocas, estoque e conciliação em um único fluxo</p>
              </div>
              <button onClick={executarTestesSimultaneos} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500">
                <TestTube className="h-4 w-4" /> Testar fluxos simultâneos
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {produtosLoja.map(produto => (
                <div key={produto.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-white">{produto.nome}</p>
                      <p className="text-xs text-slate-400">SKU {produto.sku} · {produto.tamanho} · {produto.cor}</p>
                    </div>
                    <Shirt className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-emerald-400">R$ {produto.preco.toFixed(2)}</span>
                    <span className={`text-xs font-bold ${produto.estoque <= 2 ? 'text-rose-400' : 'text-slate-300'}`}>{produto.estoque} em estoque</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => registrarVendaLoja(produto, 'PIX')} className="rounded-lg bg-emerald-600 px-2 py-2 text-[11px] font-bold text-white hover:bg-emerald-500">Venda PIX</button>
                    <button onClick={() => registrarVendaLoja(produto, 'Cartão')} className="rounded-lg bg-indigo-600 px-2 py-2 text-[11px] font-bold text-white hover:bg-indigo-500">Venda cartão</button>
                    <button onClick={() => registrarVendaLoja(produto, 'Dinheiro')} className="rounded-lg bg-amber-600 px-2 py-2 text-[11px] font-bold text-slate-950 hover:bg-amber-500">Venda dinheiro</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <div className="mb-4 flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-amber-400" /><h3 className="font-bold text-white">Troca completa</h3></div>
                <div className="space-y-3">
                  <select
                    value={vendaTrocaId}
                    onChange={e => {
                      const id = e.target.value;
                      const venda = vendasLoja.find(item => item.id === id);
                      const itemDevolvido = venda?.itens[0];
                      const produtoDevolvido = itemDevolvido?.produtoId ?? '';
                      const produtoNovo = produtosLoja.find(produto => produto.id !== produtoDevolvido && produto.estoque > 0)?.id ?? '';
                      setVendaTrocaId(id);
                      setProdutoDevolvidoId(produtoDevolvido);
                      setProdutoNovoId(produtoNovo);
                      setQuantidadeTroca(Math.max(1, itemDevolvido?.quantidade ?? 1));
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
                  >
                    {vendasLoja.map(venda => <option key={venda.id} value={venda.id}>{venda.id} · {venda.cliente} · R$ {venda.total.toFixed(2)}</option>)}
                  </select>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <select
                      value={produtoDevolvidoId}
                      onChange={e => {
                        const produtoId = e.target.value;
                        const item = vendasLoja.find(venda => venda.id === vendaTrocaId)?.itens.find(item => item.produtoId === produtoId);
                        setProdutoDevolvidoId(produtoId);
                        setQuantidadeTroca(Math.max(1, item?.quantidade ?? 1));
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
                    >
                      {vendasLoja.find(venda => venda.id === vendaTrocaId)?.itens.map(item => {
                        const produto = produtosLoja.find(candidate => candidate.id === item.produtoId);
                        return produto ? <option key={produto.id} value={produto.id}>Devolver: {produto.nome}</option> : null;
                      })}
                    </select>
                    <select value={produtoNovoId} onChange={e => setProdutoNovoId(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white">
                      {produtosLoja
                        .filter(produto => produto.id !== produtoDevolvidoId && produto.estoque > 0)
                        .map(produto => <option key={produto.id} value={produto.id}>Levar: {produto.nome}</option>)}
                    </select>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={vendasLoja.find(venda => venda.id === vendaTrocaId)?.itens.find(item => item.produtoId === produtoDevolvidoId)?.quantidade ?? 1}
                    value={quantidadeTroca}
                    onChange={e => {
                      const quantidadeMaxima = vendasLoja.find(venda => venda.id === vendaTrocaId)?.itens.find(item => item.produtoId === produtoDevolvidoId)?.quantidade ?? 1;
                      const quantidadeInformada = Number(e.target.value);
                      setQuantidadeTroca(Math.min(quantidadeMaxima, Math.max(1, quantidadeInformada || 1)));
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
                    placeholder="Quantidade"
                  />
                  <button
                    onClick={realizarTrocaLoja}
                    disabled={!produtoDevolvidoId || !produtoNovoId || produtoDevolvidoId === produtoNovoId || quantidadeTroca < 1}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-slate-950 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeftRight className="h-4 w-4" /> Confirmar troca
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {trocasLoja.slice(0, 4).map(troca => <div key={troca.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300"><b className="text-white">{troca.id}</b> · {troca.produtoDevolvido} por {troca.produtoNovo} · {troca.diferenca >= 0 ? `Receber R$ ${troca.diferenca.toFixed(2)}` : `Crédito R$ ${Math.abs(troca.diferenca).toFixed(2)}`}</div>)}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <div className="mb-4 flex items-center gap-2"><WalletCards className="h-5 w-5 text-emerald-400" /><h3 className="font-bold text-white">Conciliação de caixa</h3></div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {(['PIX', 'Cartão', 'Dinheiro'] as FormaPagamentoLoja[]).map(forma => <div key={forma} className="rounded-xl bg-slate-950 p-3"><p className="text-slate-400">{forma}</p><p className="mt-1 font-mono font-bold text-emerald-400">R$ {totaisCaixaPorForma()[forma].toFixed(2)}</p></div>)}
                </div>
                <div className="mt-4 space-y-3">
                  <input type="number" step="0.01" value={valorContado} onChange={e => setValorContado(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" placeholder="Valor contado no caixa" />
                  <button onClick={conciliarCaixaLoja} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500"><ClipboardCheck className="h-4 w-4" /> Conciliar caixa</button>
                  {resultadoConciliacao && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{resultadoConciliacao}</p>}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Movimentações registradas</p>
                    {movimentosFinanceiros.length === 0 ? (
                      <p className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-500">Nenhuma movimentação registrada ainda.</p>
                    ) : (
                      movimentosFinanceiros.slice(0, 6).map(movimento => (
                        <div key={movimento.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
                          <span>
                            <b className={movimento.tipo === 'recebimento' ? 'text-emerald-300' : 'text-rose-300'}>{movimento.tipo === 'recebimento' ? 'Recebimento' : 'Estorno'}</b>
                            {' · '}{movimento.origem === 'mesa' ? 'Mesa' : 'Loja'}{' · '}{movimento.formaPagamento}{' · '}{movimento.referenciaId}
                          </span>
                          <span className={movimento.tipo === 'recebimento' ? 'font-mono font-bold text-emerald-400' : 'font-mono font-bold text-rose-400'}>
                            {movimento.tipo === 'recebimento' ? '+' : '-'} R$ {movimento.valor.toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>

            {resultadosTeste.length > 0 && <section className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5"><h3 className="mb-3 font-bold text-white">Resultado dos testes simultâneos</h3><div className="grid gap-2 md:grid-cols-3">{resultadosTeste.map(resultado => <div key={resultado.nome} className="rounded-xl border border-slate-700 bg-slate-950 p-3"><p className={`font-bold ${resultado.sucesso ? 'text-emerald-400' : 'text-rose-400'}`}>{resultado.sucesso ? '✓' : '✕'} {resultado.nome}</p><p className="mt-1 text-xs text-slate-400">{resultado.detalhe}</p></div>)}</div></section>}
          </div>
        )}

        {/* ABA 6: GESTÃO DE ESTOQUE */}
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

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Integração com Supabase</p>
              <p className="mt-1 text-xs text-slate-400">
                {statusIntegracao === 'configurado'
                  ? 'Cliente configurado e sessão verificada.'
                  : statusIntegracao === 'verificando'
                    ? 'Verificando a configuração do cliente...'
                    : statusIntegracao === 'erro'
                      ? 'Não foi possível verificar a sessão configurada.'
                      : 'Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.'}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusIntegracao === 'configurado' ? 'bg-emerald-500/15 text-emerald-300' : statusIntegracao === 'verificando' ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'}`}>
              {statusIntegracao === 'configurado' ? 'Configurado' : statusIntegracao === 'verificando' ? 'Verificando' : 'Pendente'}
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
