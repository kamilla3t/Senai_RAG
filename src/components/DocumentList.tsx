import type { Document } from '../types/document';

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => void;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return <p className="empty">Nenhum documento anexado.</p>;
  }

  return (
    <ul className="doc-list">
      {documents.map((doc) => (
        <li key={doc.id} className="card doc-card">
          <div className="doc-head">
            <strong className="doc-title">{doc.title}</strong>
            <span className="doc-date">
              {new Date(doc.createdAt).toLocaleString('pt-BR')}
            </span>
          </div>

          <p className="doc-content">{doc.content || '(sem conteúdo)'}</p>

          {onDelete ? (
            <div className="row">
              <button
                type="button"
                className="danger"
                onClick={() => onDelete(doc.id)}
              >
                Excluir
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}