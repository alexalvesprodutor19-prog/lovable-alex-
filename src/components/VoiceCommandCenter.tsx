import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Send, Volume2 } from 'lucide-react';

type SpeechRecognitionResultItem = { transcript: string };
type SpeechRecognitionResult = { 0: SpeechRecognitionResultItem; isFinal: boolean };
type SpeechRecognitionEvent = { results: ArrayLike<SpeechRecognitionResult> };
type SpeechRecognitionErrorEvent = { error: string };

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type VoiceCommandCenterProps = {
  onCommand?: (command: string) => boolean;
};

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const aliases: Record<string, string[]> = {
  mesas: ['mesas', 'mesa', 'atendimento', 'restaurante'],
  cardapio: ['cardapio', 'cardapio', 'menu', 'comida', 'bebida'],
  kds: ['kds', 'cozinha', 'producao', 'pedidos'],
  caixa: ['caixa', 'financeiro', 'recebimentos', 'conciliacao'],
  estoque: ['estoque', 'inventario', 'produtos'],
  loja: ['loja', 'roupas', 'vendas', 'vestuario'],
  testes: ['testes', 'teste', 'validar', 'simultaneos'],
};

const getRecognitionConstructor = () => {
  if (typeof window === 'undefined') return null;
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
};

export function VoiceCommandCenter({ onCommand }: VoiceCommandCenterProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [listening, setListening] = useState(false);
  const [command, setCommand] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [message, setMessage] = useState('Diga uma ação ou escreva um comando.');
  const [supported, setSupported] = useState(false);

  const recognitionConstructor = useMemo(() => getRecognitionConstructor(), []);

  useEffect(() => {
    setSupported(Boolean(recognitionConstructor));

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [recognitionConstructor]);

  const executeCommand = (rawCommand: string) => {
    const text = rawCommand.trim();
    if (!text) return;

    const normalized = normalize(text).replace(/^(ember ops|ember|sistema)\s+/, '');
    let executed = onCommand?.(normalized) ?? false;

    if (!executed) {
      const tabAlias = Object.entries(aliases).find(([, values]) => values.some(value => normalized.includes(value)));
      const buttons = Array.from(document.querySelectorAll('button'));
      const normalizedButtons = buttons.map(button => ({
        button,
        label: normalize(button.textContent ?? ''),
      }));

      if (tabAlias) {
        const matchingButton = normalizedButtons.find(({ label }) => aliases[tabAlias[0]].some(value => label === value || label.startsWith(`${value} `)));
        if (matchingButton) {
          matchingButton.button.click();
          executed = true;
        }
      }

      if (!executed) {
        const commandWords = normalized
          .replace(/^(abra|abrir|ir para|va para|mostrar|mostre|selecione|selecionar|execute|executar|faca|fazer|confirme|confirmar)\s+/, '')
          .trim();
        const matchingButton = normalizedButtons.find(({ label }) => {
          if (!label || label.length < 2) return false;
          return label.includes(commandWords) || commandWords.includes(label);
        });
        if (matchingButton) {
          matchingButton.button.click();
          executed = true;
        }
      }
    }

    setLastCommand(text);
    setCommand('');
    setMessage(executed ? `Comando executado: ${text}` : `Nenhuma ação correspondente encontrada para: ${text}`);
  };

  const startListening = () => {
    if (!recognitionConstructor) {
      setMessage('O reconhecimento de voz não está disponível neste navegador. Use o campo de texto.');
      return;
    }

    const recognition = new recognitionConstructor();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      executeCommand(transcript);
    };
    recognition.onerror = event => {
      setListening(false);
      setMessage(`Não foi possível ouvir o comando (${event.error}).`);
    };
    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    setMessage('Ouvindo… diga o comando em português.');
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setMessage('Escuta encerrada.');
  };

  return (
    <section className="mt-6 rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Controle por voz</p>
          <h2 className="mt-1 text-xl font-bold text-white">Comandos livres no Ember Ops</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">Fale ou escreva uma ação. O comando aciona as ações disponíveis na interface e mantém as validações do sistema.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${supported ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
          {supported ? 'Microfone disponível' : 'Use texto ou permita o microfone'}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors ${listening ? 'bg-rose-600 hover:bg-rose-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? 'Parar escuta' : 'Falar comando'}
        </button>
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={event => {
            event.preventDefault();
            executeCommand(command);
          }}
        >
          <input
            value={command}
            onChange={event => setCommand(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
            placeholder="Ex.: abrir estoque, vender camisa no PIX, testar fluxos"
            aria-label="Comando para o Ember Ops"
          />
          <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-3 text-sm font-bold text-white hover:bg-slate-600">
            <Send className="h-4 w-4" />
            Executar
          </button>
        </form>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <Volume2 className="h-4 w-4 text-cyan-300" />
        <span>{message}</span>
      </div>
      {lastCommand && <p className="mt-2 text-xs text-slate-500">Último comando: {lastCommand}</p>}
    </section>
  );
}
