'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function GtmPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const query = searchParams.toString();
    const page = query ? `${pathname}?${query}` : pathname;
    window.dataLayer?.push({ event: 'pageview', page });
  }, [pathname, searchParams]);

  return null;
}
