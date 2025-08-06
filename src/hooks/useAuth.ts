import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { User } from '../types'; // Sua interface User personalizada
import { User as SupabaseUser } from '@supabase/supabase-js'; // Importa o tipo User do Supabase

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para mapear o User do Supabase para a sua interface User
  const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) {
      return null;
    }
    // Acessa name e role de user_metadata
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: (supabaseUser.user_metadata?.name as string) || '', // Garante que é string ou vazio
      role: (supabaseUser.user_metadata?.role as 'user' | 'admin') || 'user', // Garante o tipo e um valor padrão
      created_at: supabaseUser.created_at || '',
      user_metadata: supabaseUser.user_metadata // Mantém user_metadata para consistência
    };
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verifica o usuário atual ao carregar
        const currentUser = await authService.getCurrentUser();
        setUser(mapSupabaseUserToAppUser(currentUser));
      } catch (error) {
        console.error("Erro ao verificar autenticação inicial:", error);
        setUser(null); // Garante que o usuário é null em caso de erro
      } finally {
        setLoading(false); // Define loading como false após a tentativa de verificação
      }
    };

    checkAuth();

    // Escuta mudanças de autenticação em tempo real
    const { data: { subscription } } = authService.onAuthStateChange((userFromAuthService: SupabaseUser | null) => {
      setUser(mapSupabaseUserToAppUser(userFromAuthService));
      setLoading(false); // Também define loading como false em mudanças de estado
    });

    return () => {
      // Limpa a subscrição ao desmontar o componente
      subscription.unsubscribe();
    };
  }, []); // Array de dependências vazio para rodar apenas uma vez na montagem

  const signIn = async (email: string, password: string) => {
    try {
      await authService.signIn(email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'user' | 'admin' = 'user') => {
    try {
      await authService.signUp(email, password, name, role);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null); // Limpa o usuário no estado local após o logout
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' // Verifica se a role é 'admin'
  };
};
