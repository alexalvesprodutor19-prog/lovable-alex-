import React, { useMemo, useState } from 'react';

type MemoryKind = 'episódica' | 'declarativa';
type Tone = 'objetivo' | 'acolhedor' | 'direto';
type StrategicFocus = 'vendas' | 'marketing digital' | 'gestão';

interface Memory {
  id: string;
  text: string;
  kind: MemoryKind;
  createdAt: string;
  tags: string[];
}

interface Interpretation {
  fact: string;
  subtext: string;
  emotion: string;
  perspective: string;
  signals: string[];
  limitation: string;
}

interface Recommendation {
  id: string;
  focus: StrategicFocus;
  title: string;
  action: string;
  reason: string;
  priority: 'alta' | 'média' | 'baixa';
}

interface AuditEntry {
  id: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = 'ember-cognitive-memory-v1';
const AUDIT_KEY = 'ember-cognitive-audit-v1';

const tokenize = (value: string) =>
  value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 2);

const readMemories = (): Memory[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Memory[]) : [];
  } catch {
    return [];
  }
};

const readAudit = (): AuditEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(AUDIT_KEY);
    return saved ? (JSON.parse(saved) as AuditEntry[]) : [];
  } catch {
    return [];
  }
};

const inferInterpretation = (text: string): Interpretation => {
  const normalized = text.toLocaleLowerCase('pt-BR');
  const fact = text.trim() || 'Nenhum fato foi informado ainda.';
  const hasQuestion = text.includes('?');
  const hasUrgency = /(urgente|agora|rápido|rapido|problema|erro|falhou|preciso|corrija)/i.test(normalized);
  const hasFrustration = /(cansado|frustrad|decepcion|não funciona|nao funciona|difícil|dificil|novamente|irritad)/i.test(normalized);
  const hasDoubt = /(talvez|será|sera|acho|dúvida|duvida|não sei|nao sei|como posso)/i.test(normalized);
  const hasPositiveSignal = /(obrigad|ótimo|otimo|gostei|perfeito|parabéns|parabens)/i.test(normalized);
  const wordCount = tokenize(text).length;
  const signals: string[] = [];

  if (hasUrgency) signals.push('Escolha de palavras compatível com pressa ou necessidade de resolução.');
  if (hasDoubt || hasQuestion) signals.push('Perguntas ou termos de incerteza podem indicar necessidade de esclarecimento.');
  if (hasFrustration) signals.push('Vocabulário possivelmente associado a frustração ou desgaste.');
  if (wordCount > 0 && wordCount <= 5) signals.push('Mensagem curta; pode indicar objetividade ou pouco tempo disponível.');
  if (signals.length === 0) signals.push('Nenhum sinal textual forte foi identificado.');

  return {
    fact,
    subtext: hasQuestion
      ? 'Há uma busca explícita por esclarecimento ou decisão.'
      : hasUrgency
        ? 'O pedido sugere necessidade de resolução prática e rápida.'
        : 'O objetivo implícito ainda precisa ser confirmado pelo contexto.',
    emotion: hasFrustration
      ? 'Hipótese: possível frustração ou desgaste; responder com clareza e sem defensividade.'
      : hasDoubt
        ? 'Hipótese: possível dúvida ou insegurança; explicar critérios antes de recomendar.'
        : hasPositiveSignal
          ? 'Hipótese: sinal positivo; manter objetividade sem exagerar na validação.'
          : 'Hipótese não conclusiva; evitar presumir sentimentos.',
    perspective: hasUrgency
      ? 'A pessoa provavelmente prioriza uma ação segura, objetiva e verificável.'
      : 'A pessoa provavelmente espera que o contexto seja considerado antes da resposta.',
    signals,
    limitation: 'A transcrição não permite avaliar ritmo real, volume ou entonação da voz. Estes sinais são apenas hipóteses textuais.'
  };
};

const retrieveRelevant = (memories: Memory[], query: string) => {
  const queryTokens = new Set(tokenize(query));
  return memories
    .map(memory => {
      const memoryTokens = new Set(tokenize(`${memory.text} ${memory.tags.join(' ')}`));
      const score = [...queryTokens].filter(token => memoryTokens.has(token)).length;
      return { memory, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || b.memory.createdAt.localeCompare(a.memory.createdAt))
    .slice(0, 5)
    .map(item => item.memory);
};

const buildRecommendations = (focus: StrategicFocus, input: string, memories: Memory[]): Recommendation[] => {
  const context = input.trim() || 'o contexto atual do Ember Ops';
  const hasData = memories.length > 0 || input.trim().length > 0;

  if (focus === 'vendas') {
    return [
      {
        id: 'rec-vendas-1',
        focus,
        title: 'Testar uma oferta de baixo risco',
        action: `Definir uma oferta clara para ${context}, com público, prazo e critério de sucesso antes de publicar.`,
        reason: hasData ? 'Usa o contexto informado sem prometer conversão.' : 'Faltam dados de público e histórico; começar por uma hipótese controlada.',
        priority: 'alta'
      },
      {
        id: 'rec-vendas-2',
        focus,
        title: 'Acompanhar o funil',
        action: 'Registrar contatos, propostas, conversões e perdas por etapa para descobrir onde a venda está parando.',
        reason: 'Uma recomendação depende de dados observáveis, não de resultado presumido.',
        priority: 'média'
      }
    ];
  }

  if (focus === 'marketing digital') {
    return [
      {
        id: 'rec-marketing-1',
        focus,
        title: 'Criar uma mensagem principal',
        action: `Escrever uma mensagem curta para ${context}, destacando benefício, prova disponível e próximo passo.`,
        reason: 'Posicionamento consistente facilita comparar diferentes campanhas.',
        priority: 'alta'
      },
      {
        id: 'rec-marketing-2',
        focus,
        title: 'Fazer um teste comparável',
        action: 'Testar duas versões de chamada para ação mantendo público e período constantes; comparar os dados reais depois.',
        reason: 'Evita atribuir vendas a uma campanha sem evidência suficiente.',
        priority: 'média'
      }
    ];
  }

  return [
    {
      id: 'rec-gestao-1',
      focus,
      title: 'Priorizar risco operacional',
      action: 'Listar o impacto e a urgência dos pontos críticos antes de alterar processos, caixa ou estoque.',
      reason: 'Mudanças em operações delicadas devem ser revisadas e autorizadas.',
      priority: 'alta'
    },
    {
      id: 'rec-gestao-2',
      focus,
      title: 'Criar uma rotina de conferência',
      action: 'Revisar diariamente indicadores disponíveis, pendências e falhas registradas, com responsável e prazo.',
      reason: 'A rotina transforma sinais dispersos em prioridades auditáveis.',
      priority: 'média'
    }
  ];
};

export function CognitiveKit() {
  const [memories, setMemories] = useState<Memory[]>(readMemories);
  const [input, setInput] = useState('');
  const [memoryText, setMemoryText] = useState('');
  const [memoryKind, setMemoryKind] = useState<MemoryKind>('episódica');
  const [tone, setTone] = useState<Tone>('objetivo');
  const [showAllMemories, setShowAllMemories] = useState(false);
  const [focus, setFocus] = useState<StrategicFocus>('vendas');
  const [showHumor, setShowHumor] = useState(true);
  const [audit, setAudit] = useState<AuditEntry[]>(readAudit);

  const interpretation = useMemo(() => inferInterpretation(input), [input]);
  const relevantMemories = useMemo(() => retrieveRelevant(memories, input), [memories, input]);
  const visibleMemories = showAllMemories ? memories : relevantMemories;
  const recommendations = useMemo(() => buildRecommendations(focus, input, memories), [focus, input, memories]);
  const humorIsAppropriate = showHumor && !/(urgente|problema|erro|falhou|frustrad|financeir|pagamento|estorno|caixa)/i.test(input);

  const persistMemories = (next: Memory[]) => {
    setMemories(next);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addAuditEntry = (text: string) => {
    const entry: AuditEntry = { id: `AUD-${Date.now()}`, text, createdAt: new Date().toISOString() };
    const next = [entry, ...audit].slice(0, 30);
    setAudit(next);
    if (typeof window !== 'undefined') window.localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
  };

  const addMemory = () => {
    const text = memoryText.trim();
    if (!text) return;
    const next: Memory = {
      id: `MEM-${Date.now()}`,
      text,
      kind: memoryKind,
      createdAt: new Date().toISOString(),
      tags: tokenize(text).slice(0, 8)
    };
    persistMemories([next, ...memories].slice(0, 100));
    setMemoryText('');
  };

  const removeMemory = (id: string) => persistMemories(memories.filter(memory => memory.id !== id));

  const requestAuthorization = (recommendation: Recommendation) => {
    addAuditEntry(`Autorização solicitada para: ${recommendation.title}. Nenhuma alteração foi executada.`);
  };

  return (
    <section className="mt-6 rounded-2xl border border-violet-500/30 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Kit cognitivo</p>
          <h2 className="mt-1 text-xl font-bold text-white">Memória, contexto e estratégia</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">O kit separa fatos de hipóteses, recupera memórias relevantes e recomenda próximos passos sem inventar resultados.</p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Memória local ativa</span>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Entrada para interpretação</label>
            <textarea value={input} onChange={event => setInput(event.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none transition focus:border-violet-400" placeholder="Escreva uma mensagem, intenção ou situação para analisar..." />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-300">Fato</p><p className="mt-2 text-sm text-slate-200">{interpretation.fact}</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-300">Subtexto</p><p className="mt-2 text-sm text-slate-300">{interpretation.subtext}</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-300">Sinais emocionais</p><p className="mt-2 text-sm text-slate-300">{interpretation.emotion}</p><ul className="mt-2 space-y-1 text-xs text-slate-500">{interpretation.signals.map(signal => <li key={signal}>• {signal}</li>)}</ul></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-300">Perspectiva</p><p className="mt-2 text-sm text-slate-300">{interpretation.perspective}</p><p className="mt-2 text-xs text-amber-300">{interpretation.limitation}</p></div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-white">Resposta calibrada</p><p className="text-xs text-slate-500">Humor é opcional e nunca aparece em situações delicadas.</p></div><label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={showHumor} onChange={event => setShowHumor(event.target.checked)} className="accent-violet-500" /> Permitir humor discreto</label></div>
            <p className="mt-3 rounded-lg bg-slate-900 p-3 text-sm text-slate-300">{humorIsAppropriate ? 'Se couber: “Vamos resolver isso sem transformar o painel em caça ao tesouro.”' : 'Sem humor neste contexto: prioridade para clareza, segurança e acolhimento.'}</p>
          </div>

          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-white">Estratégia comercial e digital</p><p className="text-xs text-slate-300">Recomendações baseadas apenas no contexto disponível.</p></div><select value={focus} onChange={event => setFocus(event.target.value as StrategicFocus)} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="vendas">Vendas</option><option value="marketing digital">Marketing digital</option><option value="gestão">Gestão do negócio</option></select></div>
            <div className="mt-3 space-y-2">{recommendations.map(recommendation => <div key={recommendation.id} className="rounded-lg border border-slate-700 bg-slate-950 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-white">{recommendation.title}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${recommendation.priority === 'alta' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{recommendation.priority}</span></div><p className="mt-2 text-sm text-slate-300">{recommendation.action}</p><p className="mt-2 text-xs text-slate-500">{recommendation.reason}</p><button onClick={() => requestAuthorization(recommendation)} className="mt-3 rounded-lg border border-violet-400/40 px-3 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/20">Solicitar autorização</button></div>)}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-300">Ciclo antes da resposta</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{['Contexto', 'Memórias', 'Validação', 'Recomendação', 'Autorização'].map((step, index) => <div key={step} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300"><span className="font-bold text-violet-300">{index + 1}</span><br />{step}</div>)}</div></div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-3 flex items-center justify-between gap-3"><div><p className="font-bold text-white">Memória de longo prazo</p><p className="text-xs text-slate-500">{relevantMemories.length} memória(s) relevante(s) para a entrada</p></div><button onClick={() => setShowAllMemories(value => !value)} className="rounded-lg border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-300 hover:border-violet-400 hover:text-white">{showAllMemories ? 'Só relevantes' : 'Ver todas'}</button></div>
            <div className="max-h-64 space-y-2 overflow-y-auto">{visibleMemories.length === 0 ? <p className="rounded-lg border border-dashed border-slate-700 p-4 text-xs text-slate-500">Nenhuma memória relacionada encontrada.</p> : visibleMemories.map(memory => <div key={memory.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3"><div><span className="text-[10px] font-bold uppercase text-violet-300">{memory.kind}</span><p className="mt-1 text-sm text-slate-300">{memory.text}</p></div><button onClick={() => removeMemory(memory.id)} className="text-xs text-rose-300 hover:text-rose-200">Excluir</button></div>)}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="font-bold text-white">Registrar memória</p><p className="mt-1 text-xs text-slate-500">Use fatos estáveis, preferências ou acontecimentos importantes.</p><textarea value={memoryText} onChange={event => setMemoryText(event.target.value)} className="mt-3 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-violet-400" placeholder="Ex.: prefere respostas curtas e objetivas" /><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select value={memoryKind} onChange={event => setMemoryKind(event.target.value as MemoryKind)} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white"><option value="episódica">Episódica</option><option value="declarativa">Declarativa</option></select><button onClick={addMemory} className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500">Salvar memória</button></div></div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-white">Personalidade e estilo</p><p className="text-xs text-slate-500">Honestidade, pragmatismo, empatia fundamentada e admissão de lacunas.</p></div><select value={tone} onChange={event => setTone(event.target.value as Tone)} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="objetivo">Objetivo</option><option value="acolhedor">Acolhedor</option><option value="direto">Direto</option></select></div><p className="mt-3 rounded-lg bg-slate-900 p-3 text-xs text-slate-300">Tom selecionado: <span className="font-bold text-violet-300">{tone}</span>. O kit não afirma sentimentos, não promete vendas e não executa alterações sem autorização.</p></div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-white">Auditoria de autorizações</p><p className="text-xs text-slate-400">Solicitações registradas localmente; nenhuma mudança foi executada.</p></div><span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-amber-300">{audit.length}</span></div><div className="mt-3 max-h-36 space-y-2 overflow-y-auto">{audit.length === 0 ? <p className="text-xs text-slate-500">Nenhuma autorização solicitada.</p> : audit.slice(0, 5).map(entry => <p key={entry.id} className="rounded-lg bg-slate-950 p-2 text-xs text-slate-300">{entry.text}</p>)}</div></div>
        </div>
      </div>
    </section>
  );
}
