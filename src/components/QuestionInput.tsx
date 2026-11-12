import { useState, type FormEvent } from 'react';

interface QuestionInputProps {
  onSubmit: (question: string) => void | Promise<void>;
}

export function QuestionInput({ onSubmit }: QuestionInputProps) {
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const current = question.trim();
    if (!current || busy) return;

    setBusy(true);
    try {
      await onSubmit(current);
      setQuestion('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <textarea
        className="input"
        placeholder="Faça uma pergunta..."
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={4}
      />
      <button type="submit" className="ask-button" disabled={busy || question.trim().length === 0}>
        {busy ? 'Perguntando...' : 'Perguntar'}
      </button>
    </form>
  );
}