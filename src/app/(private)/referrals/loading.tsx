import { SkeletonCards, SkeletonPage } from '@/components/Skeleton';

/** Mesmo esqueleto que a página desenha enquanto busca os dados — a troca fica contínua. */
export default function Loading() {
  return (<SkeletonPage><SkeletonCards count={3}/></SkeletonPage>);
}
