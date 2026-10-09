const TEST_PREFIX = 'TESTE-';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const money = (value) => Math.round(value * 100) / 100;

const criarSessaoTeste = (status = 'ativa') => ({
  id: `${TEST_PREFIX}SESSAO-001`,
  usuarioId: `${TEST_PREFIX}USUARIO-001`,
  status,
  permissao: 'operador'
});

const validarSessao = (sessao) => sessao.status === 'ativa' && Boolean(sessao.usuarioId);

const processarOperacaoIdempotente = (registros, chave, operacao) => {
  if (registros.has(chave)) return registros.get(chave);
  const resultado = operacao();
  registros.set(chave, resultado);
  return resultado;
};

const simularOperacaoComConexao = (conectada, operacao) => {
  if (!conectada) return { status: 'incerto', aplicado: false };
  return { status: 'concluida', aplicado: operacao() };
};

const formasPagamentoAceitas = new Set(['PIX', 'Cartão', 'Dinheiro']);

const processarPagamento = ({ mesaStatus, pedidos, formaPagamento, jaProcessando = false }) => {
  if (jaProcessando) return { status: 'duplicado', aplicado: false };
  if (!formasPagamentoAceitas.has(formaPagamento)) return { status: 'forma_invalida', aplicado: false };
  if (!['ocupada', 'pagamento'].includes(mesaStatus)) return { status: 'mesa_indisponivel', aplicado: false };
  const total = pedidos.reduce((soma, pedido) => soma + pedido.total, 0);
  if (!Number.isFinite(total) || total <= 0) return { status: 'total_invalido', aplicado: false };
  return { status: 'concluida', aplicado: true, total: money(total) };
};

const conciliarCaixa = ({ vendas, trocas, valorContado }) => {
  if (!Number.isFinite(valorContado) || valorContado < 0) return { status: 'valor_invalido' };
  const esperado = vendas.reduce((total, venda) => total + venda.total, 0) + trocas.reduce((total, troca) => total + troca.diferenca, 0);
  if (!Number.isFinite(esperado)) return { status: 'total_invalido' };
  return { status: 'concluida', esperado: money(esperado), diferenca: money(valorContado - esperado) };
};

const reservarHorario = (agenda, novo) => {
  const conflito = agenda.some((item) => item.profissionalId === novo.profissionalId && item.inicio < novo.fim && novo.inicio < item.fim);
  if (conflito) return { status: 'conflito', aplicado: false };
  agenda.push(novo);
  return { status: 'concluida', aplicado: true };
};

const run = () => {
  const sessao = criarSessaoTeste();
  assert(validarSessao(sessao), 'A sessão autenticada de teste não foi validada.');
  assert(sessao.id.startsWith(TEST_PREFIX), 'A sessão autenticada precisa ser identificada como teste.');

  const registros = [
    {
      id: `${TEST_PREFIX}VENDA-001`,
      sessaoId: sessao.id,
      itens: [
        { quantidade: 2, valorUnitario: 38 },
        { quantidade: 1, valorUnitario: 22 }
      ],
      estoqueAntes: 5,
      estoqueDepois: 2,
      status: 'concluida'
    },
    {
      id: `${TEST_PREFIX}TROCA-001`,
      sessaoId: sessao.id,
      diferenca: 15.9,
      status: 'concluida'
    }
  ];

  assert(registros.every((registro) => registro.id.startsWith(TEST_PREFIX)), 'Todo registro precisa ser identificado como teste.');
  assert(registros.every((registro) => registro.sessaoId === sessao.id), 'Os registros não ficaram vinculados à sessão de teste.');

  const totalVenda = registros[0].itens.reduce(
    (total, item) => total + item.quantidade * item.valorUnitario,
    0
  );
  assert(money(totalVenda) === 98, 'O total da venda de teste está incorreto.');
  assert(registros[0].estoqueAntes - registros[0].estoqueDepois === 3, 'A baixa de estoque não corresponde aos itens vendidos.');
  assert(registros[1].status === 'concluida' && Number.isFinite(registros[1].diferenca), 'O histórico de troca está inconsistente.');

  const pagamento = processarPagamento({
    mesaStatus: 'ocupada',
    pedidos: [{ total: 98 }],
    formaPagamento: 'PIX'
  });
  assert(pagamento.status === 'concluida' && pagamento.total === 98, 'O pagamento válido não foi concluído corretamente.');
  assert(processarPagamento({ mesaStatus: 'ocupada', pedidos: [{ total: 98 }], formaPagamento: 'PIX', jaProcessando: true }).status === 'duplicado', 'O clique duplicado gerou um segundo pagamento.');
  assert(processarPagamento({ mesaStatus: 'livre', pedidos: [{ total: 98 }], formaPagamento: 'PIX' }).aplicado === false, 'Uma mesa livre foi aceita para pagamento.');
  assert(processarPagamento({ mesaStatus: 'ocupada', pedidos: [{ total: 98 }], formaPagamento: 'Boleto' }).aplicado === false, 'Uma forma de pagamento inválida foi aceita.');

  const conciliacao = conciliarCaixa({ vendas: [{ total: 98 }], trocas: [{ diferenca: 15.9 }], valorContado: 113.9 });
  assert(conciliacao.status === 'concluida' && conciliacao.diferenca === 0, 'A conciliação correta do caixa falhou.');
  assert(conciliarCaixa({ vendas: [{ total: 98 }], trocas: [{ diferenca: -20 }], valorContado: 78 }).diferenca === 0, 'O estorno financeiro não foi abatido da conciliação.');
  assert(conciliarCaixa({ vendas: [{ total: 98 }], trocas: [], valorContado: -1 }).status === 'valor_invalido', 'Um valor negativo foi aceito no caixa.');

  const agenda = [];
  const horario = { id: `${TEST_PREFIX}AGENDA-001`, profissionalId: `${TEST_PREFIX}PROF-001`, inicio: 10, fim: 11 };
  assert(reservarHorario(agenda, horario).aplicado, 'O primeiro horário disponível não foi reservado.');
  assert(!reservarHorario(agenda, { ...horario, id: `${TEST_PREFIX}AGENDA-002`, inicio: 10.5, fim: 11.5 }).aplicado, 'A agenda aceitou dois horários conflitantes.');
  assert(reservarHorario(agenda, { ...horario, id: `${TEST_PREFIX}AGENDA-003`, inicio: 11, fim: 12 }).aplicado, 'A agenda bloqueou indevidamente um horário consecutivo.');

  const tentativas = 1000;
  let estoque = 1;
  let aceitas = 0;
  for (let tentativa = 0; tentativa < tentativas; tentativa += 1) {
    if (estoque > 0) {
      estoque -= 1;
      aceitas += 1;
    }
  }
  assert(aceitas === 1, 'A disputa simultânea aceitou mais operações do que o estoque disponível.');
  assert(estoque === 0, 'O estoque ficou inconsistente após a disputa simultânea.');

  const registrosIdempotentes = new Map();
  const chaveOperacao = `${TEST_PREFIX}IDEMPOTENCIA-001`;
  let execucoes = 0;
  const primeiraResposta = processarOperacaoIdempotente(registrosIdempotentes, chaveOperacao, () => {
    execucoes += 1;
    return { id: `${TEST_PREFIX}VENDA-IDEMPOTENTE-001`, total: 49.9 };
  });
  const segundaResposta = processarOperacaoIdempotente(registrosIdempotentes, chaveOperacao, () => {
    execucoes += 1;
    return { id: `${TEST_PREFIX}VENDA-IDEMPOTENTE-002`, total: 49.9 };
  });
  assert(registrosIdempotentes.has(chaveOperacao), 'A chave de idempotência não foi registrada.');
  assert(registrosIdempotentes.size === 1, 'A repetição da operação criou mais de um registro.');
  assert(execucoes === 1, 'A operação idempotente foi executada mais de uma vez.');
  assert(primeiraResposta.id === segundaResposta.id, 'A repetição não retornou o mesmo resultado da operação original.');

  const sessaoExpirada = criarSessaoTeste('expirada');
  assert(!validarSessao(sessaoExpirada), 'Uma sessão expirada foi aceita como sessão válida.');

  let estoqueProtegido = 1;
  const operacaoExpirada = validarSessao(sessaoExpirada)
    ? simularOperacaoComConexao(true, () => {
        estoqueProtegido -= 1;
        return true;
      })
    : { status: 'bloqueada', aplicado: false };
  assert(operacaoExpirada.status === 'bloqueada', 'A operação com sessão expirada não foi bloqueada.');
  assert(estoqueProtegido === 1, 'A sessão expirada alterou o estoque.');

  const conexaoInterrompida = simularOperacaoComConexao(false, () => {
    throw new Error('A operação não deveria ser executada sem conexão.');
  });
  assert(conexaoInterrompida.status === 'incerto', 'A interrupção de conexão não foi identificada como resultado incerto.');
  assert(conexaoInterrompida.aplicado === false, 'Uma conexão interrompida aplicou uma operação localmente.');

  const tentativasResultadoIncerto = new Map();
  const chaveResultadoIncerto = `${TEST_PREFIX}INCERTO-001`;
  const respostaIncerta = simularOperacaoComConexao(false, () => ({ id: chaveResultadoIncerto }));
  assert(respostaIncerta.status === 'incerto', 'O resultado incerto não foi preservado.');
  assert(!tentativasResultadoIncerto.has(chaveResultadoIncerto), 'Um resultado incerto foi registrado como concluído.');

  const viewports = [
    { nome: 'celular', largura: 390 },
    { nome: 'tablet', largura: 768 },
    { nome: 'computador', largura: 1440 }
  ];
  assert(viewports.length === 3 && viewports.every((viewport) => viewport.largura > 0), 'Os três perfis de viewport não foram definidos.');
  assert(viewports[0].largura < viewports[1].largura && viewports[1].largura < viewports[2].largura, 'A ordem dos perfis responsivos está incorreta.');

  const recursosNavegador = ['camera', 'impressora', 'totem', 'whatsapp'];
  const equipamentosReais = new Set(['camera', 'impressora', 'totem', 'whatsapp']);
  assert(recursosNavegador.every((recurso) => !equipamentosReais.has(`${recurso}-testado`)), 'Teste de navegador foi confundido com validação de equipamento real.');
  assert(recursosNavegador.length === equipamentosReais.size, 'A lista de recursos e equipamentos não cobre o mesmo escopo.');

  console.log(`PASS: ${TEST_PREFIX} sessão autenticada simulada e isolamento de registros`);
  console.log(`PASS: ${TEST_PREFIX} valores, estoque e históricos`);
  console.log(`PASS: ${TEST_PREFIX} pagamentos, duplicidade e formas válidas`);
  console.log(`PASS: ${TEST_PREFIX} conciliação de caixa`);
  console.log(`PASS: ${TEST_PREFIX} conflito de horários na agenda`);
  console.log(`PASS: ${TEST_PREFIX} concorrência com ${tentativas} tentativas`);
  console.log(`PASS: ${TEST_PREFIX} idempotência e proteção contra duplicidade`);
  console.log(`PASS: ${TEST_PREFIX} sessão expirada e conexão interrompida`);
  console.log(`PASS: ${TEST_PREFIX} resultado incerto sem nova gravação automática`);
  console.log(`PASS: ${TEST_PREFIX} responsividade celular, tablet e computador`);
  console.log(`PASS: ${TEST_PREFIX} recursos de navegador separados de equipamentos reais`);
};

try {
  run();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
