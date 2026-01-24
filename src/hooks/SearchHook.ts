'use client';

import * as React from 'react';

import type { Contact } from '@/types/Contact';

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

export function useFilter(initialData: Contact[]) {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return initialData;

    return initialData.filter((c) => {
      const haystack = normalize(
        [
          c.name,
        ].join(' '),
      );

      return haystack.includes(q);
    });
  }, [query, initialData]);

  return { query, setQuery, filtered };
}
