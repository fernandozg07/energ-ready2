import { useState } from 'react';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { EnhancedUserDashboard } from './components/Dashboard/EnhancedUserDashboard';
import { EnhancedAdminDashboard } from './components/Dashboard/EnhancedAdminDashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loading, isAdmin } = useAuth();

  // Log para depuração: Verifique os valores na consola do navegador
  console.log("App Component - User:", user);
  console.log("App Component - Loading:", loading);
  console.log("App Component - Is Admin:", isAdmin);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return isLogin ? (
      <LoginForm onToggleForm={() => setIsLogin(false)} />
    ) : (
      <RegisterForm onToggleForm={() => setIsLogin(true)} />
    );
  }

  // Renderiza o dashboard de administrador ou usuário com base na role
  return isAdmin ? <EnhancedAdminDashboard /> : <EnhancedUserDashboard />;
}

export default App;
