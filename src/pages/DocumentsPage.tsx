import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { DocumentList } from '../components/DocumentList';
import {
  describeEmbeddingProgress,
  onEmbeddingProgress,
} from '../services/embeddingService';
import { addDocument, deleteDocument, listDocuments } from '../services/documentService';
import type { Document } from '../types/document';
import { extractPdfText } from '../utils/pdfText';

type Notice = { kind: 'success' | 'error'; text: string };

const TEXT_TYPES = ['text/', 'application/json', 'application/xml', 'application/pdf', ''];

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [embedNote, setEmbedNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onEmbeddingProgress((progress) => {
      setEmbedNote(describeEmbeddingProgress(progress));
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const refresh = async () => {
    try {
      setDocuments(await listDocuments());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listDocuments();
        if (active) setDocuments(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    await refresh();
    setNotice({ kind: 'success', text: 'Documento excluído.' });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setAttaching(true);
    setNotice(null);

    try {
      const isPdf =
        file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      const looksText =
        isPdf ||
        TEXT_TYPES.some((t) => t && file.type.startsWith(t)) ||
        /\.(txt|md|csv|json|xml|html|log|ts|js|tsx|jsx|css)$/i.test(file.name);

      if (!looksText) {
        setNotice({ kind: 'error', text: `"${file.name}" não parece ser um arquivo suportado.` });
        return;
      }

      const content = isPdf ? await extractPdfText(file) : await file.text();
      if (!content.trim()) {
        setNotice({ kind: 'error', text: 'O arquivo selecionado está vazio.' });
        return;
      }

      await addDocument(file.name, content).then((result) => {
        setNotice({
          kind: 'success',
          text:
            result.embedded > 0
              ? `"${file.name}" anexado e vetorizado (${result.totalChunks} trecho(s)).`
              : `"${file.name}" anexado com ${content.length} caracteres (busca textual — vetorização indisponível).`,
        });
      });
      await refresh();
    } catch (err) {
      setNotice({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Não foi possível ler o arquivo.',
      });
    } finally {
      setAttaching(false);
    }
  };

  if (loading) {
    return <p className="muted">Carregando documentos...</p>;
  }

  return (
    <section id="documentos" className="stack gap-lg">
      <h2>Documentos</h2>

      <div className="stack gap-sm card attach-row">
        <strong>Anexar documento</strong>
        <p className="muted small">
          Adicione um arquivo texto (.txt, .md, .csv, .json, .xml, .html...) ou PDF. O conteúdo
          é indexado aqui no navegador para a busca.
        </p>

        <label className={`file-label${attaching ? ' disabled' : ''}`}>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.csv,.json,.xml,.html,.log,.pdf,text/*,application/pdf"
            onChange={handleFileChange}
            disabled={attaching}
          />
          <span className="file-button ask-button">{attaching ? 'Anexando...' : 'Escolher arquivo'}</span>
        </label>

        {attaching && embedNote ? <p className="muted small">{embedNote}</p> : null}

        {notice ? (
          <p className={notice.kind === 'error' ? 'notice error' : 'notice success'}>
            {notice.text}
          </p>
        ) : null}
      </div>

      <DocumentList documents={documents} onDelete={handleDelete} />
    </section>
  );
}