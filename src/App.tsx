import { Navigate, Route, Routes } from 'react-router-dom';
import { DocumentsPage } from './pages/DocumentsPage';
import { QuestionPage } from './pages/QuestionPage';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="brand">PocketRAG</span>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <QuestionPage />
                <DocumentsPage />
              </>
            }
          />
          <Route path="/documents" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}