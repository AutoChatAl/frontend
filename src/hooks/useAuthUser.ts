'use client';
import { useEffect, useState } from 'react';

import { AUTH_USER_UPDATED_EVENT, authService, type AuthUser } from '@/services/auth.service';

/**
 * Usuário autenticado, sempre atualizado.
 *
 * Lê o cache local na montagem (síncrono, sem piscar) e re-renderiza quando o
 * `/me` responde e reescreve esse cache. Use isto — e não `authService.getUser()`
 * direto — em qualquer lugar que decida o que mostrar a partir de `permissions`:
 * o cache pode estar defasado no primeiro render, e ler uma única vez faria uma
 * área liberada continuar escondida até a pessoa navegar para fora e voltar.
 */
export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser());

  useEffect(() => {
    const sync = () => setUser(authService.getUser());
    // `storage` cobre a outra aba; o evento próprio cobre esta aba, já que
    // `storage` não dispara na aba que escreveu.
    window.addEventListener(AUTH_USER_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    sync();
    return () => {
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return user;
}
