import { SkeletonPage, SkeletonStats, SkeletonTable } from '@/components/Skeleton';

/**
 * Mostrado pelo Suspense do App Router enquanto o chunk da rota carrega.
 *
 * Sem este arquivo a navegação fica bloqueada: o clique não muda nada na tela
 * até o JavaScript da página chegar e renderizar. É o mesmo esqueleto que a
 * página desenha depois, de propósito — assim a troca é contínua e não há salto
 * entre um esqueleto e outro.
 */
export default function Loading() {
  return (<SkeletonPage><SkeletonStats count={3}/><SkeletonTable rows={6} columns={4}/></SkeletonPage>);
}
