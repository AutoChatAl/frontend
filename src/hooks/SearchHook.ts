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
      const parts: string[] = [c.displayName ?? ''];

      for (const identity of c.identities ?? []) {
        if (identity.phoneE164) parts.push(identity.phoneE164);
        if (identity.igUsername) parts.push(identity.igUsername);
      }

      const haystack = normalize(parts.join(' '));
      return haystack.includes(q);
    });
  }, [query, initialData]);

  return { query, setQuery, filtered };
}
