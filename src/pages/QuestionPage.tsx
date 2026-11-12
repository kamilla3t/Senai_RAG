import { useEffect, useState } from 'react';
import { QuestionInput } from '../components/QuestionInput';
import { fetchAnswer } from '../services/apiService';
import {
  describeEmbeddingProgress,
  onEmbeddingProgress,
} from '../services/embeddingService';
import { searchRelevantChunks } from '../services/documentService';
import type { RelevantChunk } from '../types/search';
import { toPlainText } from '../utils/plainText';

type Status = 'idle' | 'searching' | 'success' | 'no-context' | 'error';

export function QuestionPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<RelevantChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [askedQuestion, setAskedQuestion] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [embedNote, setEmbedNote] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onEmbeddingProgress((progress) => {
      setEmbedNote(describeEmbeddingProgress(progress));
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const ask = async (question: string) => {
    setStatus('searching');
    setError(null);
    setAnswer(null);
    setSources([]);
    setEmbedNote(null);
    setAskedQuestion(question);
    setLastQuestion(question);

    try {
      const chunks = await searchRelevantChunks(question, 5);
      setSources(chunks);

      if (chunks.length === 0) {
        setStatus('no-context');
        return;
      }

      const contexts = chunks.map((c) => c.content);
      const result = await fetchAnswer(question, contexts);
      setAnswer(result || 'Sem resposta.');
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter resposta.');
      setStatus('error');
    }
  };

  const retry = () => {
    if (lastQuestion) void ask(lastQuestion);
  };

  return (
    <section id="pergunta" className="stack gap-lg">
      <h2>Pergunta</h2>

      <QuestionInput onSubmit={ask} />

      {askedQuestion ? (
        <div className="card asked">
          <span className="muted small">Sua pergunta:</span>
          <strong>{askedQuestion}</strong>
        </div>
      ) : null}

      {status === 'searching' ? (
        <div className="card status">
          <span className="spinner" aria-hidden="true" />
          <span>Buscando trechos e gerando resposta...</span>
          {embedNote ? <span className="muted small">{embedNote}</span> : null}
        </div>
      ) : null}

      {status === 'no-context' ? (
        <div className="card status warn">
          Nenhum trecho relevante encontrado nos documentos. Anexe documentos
          que contenham a resposta.
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="card status error">
          <span>Erro: {error}</span>
          <button type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      ) : null}

      {status === 'success' && answer ? (
        <div className="card status success">
          <p className="answer">{toPlainText(answer)}</p>
        </div>
      ) : null}

      {sources.length > 0 ? (
        <div className="stack gap-sm">
          <h3>Trechos selecionados ({sources.length})</h3>
          <ul className="doc-list">
            {sources.map((source, index) => (
              <li key={index} className="card doc-card">
                <strong className="doc-title">{source.title}</strong>
                <p className="doc-content">{source.content}</p>
                <span className="muted small">
                  rank: {typeof source.rank === 'number' ? source.rank.toFixed(4) : 'n/d'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}