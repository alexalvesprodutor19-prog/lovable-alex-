import React, { useMemo, useState } from 'react';

type MemoryKind = 'episódica' | 'declarativa';
type Tone = 'objetivo' | 'acolhedor' | 'direto';

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
}

const STORAGE_KEY = 'ember-cognitive-memory-v1';

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

const inferInterpretation = (text: string): Interpretation => {
  const normalized = text.toLocaleLowerCase('pt-BR');
  const fact = text.trim() || 'Nenhum fato foi informado ainda.';
  const hasQuestion = text.includes('?');
  const hasUrgency = /(urgente|agora|rápido|rapido|problema|erro|falhou|preciso)/i.test(normalized);
  const hasFrustration = /(cansado|frustrad|decepcion|não funciona|nao funciona|difícil|dificil|novamente)/i.test(normalized);
  const hasPositiveSignal = /(obrigad|ótimo|otimo|gostei|perfeito|parabéns|parabens)/i.test(normalized);

  return {
    fact,
    subtext: hasQuestion
      ? 'Há uma busca explícita por esclarecimento ou decisão.'
      : hasUrgency
        ? 'O pedido sugere necessidade de resolução prática e rápida.'
        : 'O objetivo implícito ainda precisa ser confirmado pelo contexto.',
    emotion: hasFrustration
      ? 'Possível frustração ou desgaste; responder com clareza e sem defensividade.'
      : hasPositiveSignal
        ? 'Sinal positivo; manter objetividade sem exagerar na validação.'
        : 'Estado emocional não conclusivo; evitar presumir sentimentos.',
    perspective: hasUrgency
      ? 'A pessoa provavelmente prioriza uma ação segura, objetiva e verificável.'
      : 'A pessoa provavelmente espera que o contexto seja considerado antes da resposta.'
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

export function CognitiveKit() {
  const [memories, setMemories] = useState<Memory[]>(readMemories);
  const [input, setInput] = useState('');
  const [memoryText, setMemoryText] = useState('');
  const [memoryKind, setMemoryKind] = useState<MemoryKind>('episódica');
  const [tone, setTone] = useState<Tone>('objetivo');
  const [showAllMemories, setShowAllMemories] = useState(false);

  const interpretation = useMemo(() => inferInterpretation(input), [input]);
  const relevantMemories = useMemo(() => retrieveRelevant(memories, input), [memories, input]);
  const visibleMemories = showAllMemories ? memories : relevantMemories;

  const persistMemories = (next: Memory[]) => {
    setMemories(next);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

  return (
    <section className="mt-6 rounded-2xl border border-violet-500/30 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Kit cognitivo</p>
          <h2 className="mt-1 text-xl font-bold text-white">Memória e interpretação contextual</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">O kit recupera apenas memórias relacionadas, separa fato de subtexto e calibra a comunicação antes da resposta.</p>
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
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-300">Fato</p>
              <p className="mt-2 text-sm text-slate-200">{interpretation.fact}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-300">Subtexto</p>
              <p className="mt-2 text-sm text-slate-300">{interpretation.subtext}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-300">Estado mental</p>
              <p className="mt-2 text-sm text-slate-300">{interpretation.emotion}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-300">Perspectiva</p>
              <p className="mt-2 text-sm text-slate-300">{interpretation.perspective}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-300">Ciclo antes da resposta</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {['1. Intenção e contexto', '2. Memórias relevantes', '3. Validação lógica', '4. Tom e empatia'].map((step, index) => (
                <div key={step} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300"><span className="font-bold text-violet-300">{index + 1}</span><br />{step.replace(/^\d\. /, '')}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><p className="font-bold text-white">Memória de longo prazo</p><p className="text-xs text-slate-500">{relevantMemories.length} memória(s) relevante(s) para a entrada</p></div>
              <button onClick={() => setShowAllMemories(value => !value)} className="rounded-lg border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-300 hover:border-violet-400 hover:text-white">{showAllMemories ? 'Só relevantes' : 'Ver todas'}</button>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {visibleMemories.length === 0 ? <p className="rounded-lg border border-dashed border-slate-700 p-4 text-xs text-slate-500">Nenhuma memória relacionada encontrada.</p> : visibleMemories.map(memory => (
                <div key={memory.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <div><span className="text-[10px] font-bold uppercase text-violet-300">{memory.kind}</span><p className="mt-1 text-sm text-slate-300">{memory.text}</p></div>
                  <button onClick={() => removeMemory(memory.id)} className="text-xs text-rose-300 hover:text-rose-200">Excluir</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="font-bold text-white">Registrar memória</p>
            <p className="mt-1 text-xs text-slate-500">Use fatos estáveis, preferências ou acontecimentos importantes.</p>
            <textarea value={memoryText} onChange={event => setMemoryText(event.target.value)} className="mt-3 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-violet-400" placeholder="Ex.: prefere respostas curtas e objetivas" />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select value={memoryKind} onChange={event => setMemoryKind(event.target.value as MemoryKind)} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white"><option value="episódica">Episódica</option><option value="declarativa">Declarativa</option></select>
              <button onClick={addMemory} className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500">Salvar memória</button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="font-bold text-white">Personalidade e estilo</p><p className="text-xs text-slate-500">Honestidade, pragmatismo, empatia fundamentada e admissão de lacunas.</p></div><select value={tone} onChange={event => setTone(event.target.value as Tone)} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white"><option value="objetivo">Objetivo</option><option value="acolhedor">Acolhedor</option><option value="direto">Direto</option></select></div>
            <p className="mt-3 rounded-lg bg-slate-900 p-3 text-xs text-slate-300">Tom selecionado: <span className="font-bold text-violet-300">{tone}</span>. Quando houver dúvida, o kit sinaliza a lacuna em vez de inventar uma resposta.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
