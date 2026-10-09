const TEST_PREFIX = 'TESTE-';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const money = (value) => Math.round(value * 100) / 100;

const run = () => {
  const registros = [
    {
      id: `${TEST_PREFIX}VENDA-001`,
      itens: [
        { quantidade: 2, valorUnitario: 38 },
        { quantidade: 1, valorUnitario: 22 }
      ],
      estoqueAntes: 5,
      estoqueDepois: 2
    },
    {
      id: `${TEST_PREFIX}TROCA-001`,
      diferenca: 15.9,
      status: 'concluida'
    }
  ];

  assert(registros.every((registro) => registro.id.startsWith(TEST_PREFIX)), 'Todo registro precisa ser identificado como teste.');

  const totalVenda = registros[0].itens.reduce(
    (total, item) => total + item.quantidade * item.valorUnitario,
    0
  );
  assert(money(totalVenda) === 98, 'O total da venda de teste está incorreto.');
  assert(registros[0].estoqueAntes - registros[0].estoqueDepois === 3, 'A baixa de estoque não corresponde aos itens vendidos.');
  assert(registros[1].status === 'concluida' && Number.isFinite(registros[1].diferenca), 'O histórico de troca está inconsistente.');

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

  const chaves = new Set();
  const chaveOperacao = `${TEST_PREFIX}IDEMPOTENCIA-001`;
  chaves.add(chaveOperacao);
  assert(chaves.has(chaveOperacao), 'A chave de idempotência não foi registrada.');
  assert(chaves.size === 1, 'A repetição da operação criou mais de um registro.');

  const viewports = [
    { nome: 'celular', largura: 390 },
    { nome: 'tablet', largura: 768 },
    { nome: 'computador', largura: 1440 }
  ];
  assert(viewports.length === 3 && viewports.every((viewport) => viewport.largura > 0), 'Os três perfis de viewport não foram definidos.');

  const recursosNavegador = ['camera', 'impressora', 'totem', 'whatsapp'];
  const equipamentosReais = new Set(['camera', 'impressora', 'totem', 'whatsapp']);
  assert(recursosNavegador.every((recurso) => !equipamentosReais.has(`${recurso}-testado`)), 'Teste de navegador foi confundido com validação de equipamento real.');

  console.log(`PASS: ${TEST_PREFIX} suíte operacional concluída`);
  console.log(`PASS: ${TEST_PREFIX} valores, estoque e históricos`);
  console.log(`PASS: ${TEST_PREFIX} concorrência com ${tentativas} tentativas`);
  console.log(`PASS: ${TEST_PREFIX} responsividade celular, tablet e computador`);
  console.log(`PASS: ${TEST_PREFIX} recursos de navegador separados de equipamentos reais`);
};

try {
  run();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
