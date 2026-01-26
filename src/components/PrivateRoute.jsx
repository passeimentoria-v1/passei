import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const PrivateRoute = ({ children, tipoPermitido = null }) => {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (tipoPermitido && usuario.tipo !== tipoPermitido) {
    if (usuario.tipo === 'mentor') {
      return <Navigate to="/mentor/dashboard" replace />;
    } else {
      return <Navigate to="/aluno/dashboard" replace />;
    }
  }

  return children;
};

export const MentorRoute = ({ children }) => {
  return (
    <PrivateRoute tipoPermitido="mentor">
      {children}
    </PrivateRoute>
  );
};

export const AlunoRoute = ({ children }) => {
  return (
    <PrivateRoute tipoPermitido="aluno">
      {children}
    </PrivateRoute>
  );
};

export const PublicRoute = ({ children }) => {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (usuario) {
    if (usuario.tipo === 'mentor') {
      return <Navigate to="/mentor/dashboard" replace />;
    } else {
      return <Navigate to="/aluno/dashboard" replace />;
    }
  }

  return children;
};