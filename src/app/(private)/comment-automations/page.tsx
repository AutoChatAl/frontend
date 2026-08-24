import { redirect } from 'next/navigation';

/**
 * A automação de comentários virou um filtro dentro de auto-respostas. A rota
 * fica de pé só para não quebrar link salvo ou aba aberta.
 */
export default function CommentAutomationsRedirect() {
  redirect('/auto-replies?tipo=comentario');
}
