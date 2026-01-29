import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute, PublicRoute, MentorRoute, AlunoRoute } from './components/PrivateRoute';

// Páginas públicas
import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarSenha from './pages/RecuperarSenha';

// Páginas do Mentor
import MentorDashboard from './pages/mentor/Dashboard';
import UploadEdital from './pages/mentor/UploadEdital';
import CursoDetalhes from './pages/mentor/CursoDetalhes';
import CriarMetas from './pages/mentor/CriarMetas';
import Convites from './pages/mentor/Convites';
import AcompanhamentoAlunos from './pages/mentor/AcompanhamentoAlunos';
import AlunoDetalhes from './pages/mentor/AlunoDetalhes';
import DuvidasAlunos from './pages/mentor/DuvidasAlunos';
import RelatoriosMentor from './pages/mentor/RelatoriosMentor';

// Páginas do Aluno
import AlunoDashboard from './pages/aluno/Dashboard';
import RegistrarQuestoes from './pages/aluno/RegistrarQuestoes';
import HistoricoQuestoes from './pages/aluno/HistoricoQuestoes';
import Flashcards from './pages/aluno/Flashcards';
import CriarFlashcard from './pages/aluno/CriarFlashcard';
import RevisarFlashcards from './pages/aluno/RevisarFlashcards';
import RelatoriosAluno from './pages/aluno/Relatorios';
import Configuracoes from './pages/aluno/Configuracoes';
import ReprogramarMetas from './pages/aluno/ReprogramarMetas';
import MinhasMetas from './pages/aluno/MinhasMetas';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rotas Públicas */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/registro"
            element={
              <PublicRoute>
                <Registro />
              </PublicRoute>
            }
          />
          <Route
            path="/recuperar-senha"
            element={
              <PublicRoute>
                <RecuperarSenha />
              </PublicRoute>
            }
          />

          {/* Rotas do Mentor */}
          <Route
            path="/mentor/dashboard"
            element={
              <MentorRoute>
                <MentorDashboard />
              </MentorRoute>
            }
          />
          <Route
            path="/mentor/upload-edital"
            element={
              <MentorRoute>
                <UploadEdital />
              </MentorRoute>
            }
          />
          <Route
            path="/mentor/relatorios"
            element={
              <MentorRoute>
                <RelatoriosMentor />
              </MentorRoute>
            }
          />
          <Route
            path="/mentor/duvidas"
            element={
              <MentorRoute>
                <DuvidasAlunos />
              </MentorRoute>
            }
          />
          <Route
            path="/mentor/acompanhamento"
            element={
              <MentorRoute>
                <AcompanhamentoAlunos />
              </MentorRoute>
            }
          />
          <Route
            path="/mentor/aluno/:alunoId"
            element={
              <MentorRoute>
                <AlunoDetalhes />
              </MentorRoute>
            }
          />
          <Route
            path="/mentor/curso/:cursoId"
            element={
              <MentorRoute>
                <CursoDetalhes />
              </MentorRoute>
            }
          />
          <Route
            path="/mentor/criar-metas"
            element={
              <MentorRoute>
                <CriarMetas />
              </MentorRoute>
            }
          />
          <Route
            path="/mentor/convites"
            element={
              <MentorRoute>
                <Convites />
              </MentorRoute>
            }
          />

          {/* Rotas do Aluno */}
          <Route
            path="/aluno/dashboard"
            element={
              <AlunoRoute>
                <AlunoDashboard />
              </AlunoRoute>
            }
          />
          <Route
            path="/aluno/registrar-questoes"
            element={
              <AlunoRoute>
                <RegistrarQuestoes />
              </AlunoRoute>
            }
          />
          <Route 
          path="/aluno/metas" 
          element={
            <AlunoRoute>
              <MinhasMetas />
              </AlunoRoute>} 
          />
          <Route 
          path="/aluno/reprogramar-metas" 
          element={
            <AlunoRoute>
              <ReprogramarMetas />
            </AlunoRoute>} 
            />
          <Route
            path="/aluno/relatorios"
            element={
              <AlunoRoute>
                <RelatoriosAluno />
              </AlunoRoute>
            }
          />
          <Route 
            path="/aluno/configuracoes" 
            element={
              <AlunoRoute>
                <Configuracoes />
              </AlunoRoute>} 
          />
          <Route
            path="/aluno/flashcards"
            element={
              <AlunoRoute>
                <Flashcards />
              </AlunoRoute>
            }
          />
          <Route
            path="/aluno/flashcards/criar"
            element={
              <AlunoRoute>
                <CriarFlashcard />
              </AlunoRoute>
            }
          />
          <Route
            path="/aluno/flashcards/revisar"
            element={
              <AlunoRoute>
                <RevisarFlashcards />
              </AlunoRoute>
            }
          />
          <Route
            path="/aluno/questoes"
            element={
              <AlunoRoute>
                <HistoricoQuestoes />
              </AlunoRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;