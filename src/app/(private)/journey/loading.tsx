import { SkeletonCards, SkeletonPage, SkeletonStats } from '@/components/Skeleton';

export default function Loading() {
  return (<SkeletonPage><SkeletonStats count={4}/><SkeletonCards count={3}/></SkeletonPage>);
}
