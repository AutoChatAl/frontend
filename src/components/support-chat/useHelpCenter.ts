'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { canAccessPathname } from '@/contexts/SidebarContext';
import { authService, type AuthUser } from '@/services/auth.service';
import { setupOnboardingService } from '@/services/setup-onboarding.service';
import type { BusinessType } from '@/types/BusinessType';

import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  findHelpArticle,
  searchHelpArticles,
  stripQuery,
  suggestHelpArticles,
  type HelpArticle,
  type HelpCategory,
} from './helpArticles';

export interface HelpCategoryGroup {
  id: HelpCategory;
  label: string;
  articles: HelpArticle[];
}

interface UseHelpCenterReturn {
  pathname: string;
  query: string;
  setQuery: (value: string) => void;
  results: HelpArticle[];
  suggestions: HelpArticle[];
  groups: HelpCategoryGroup[];
  activeArticle: HelpArticle | null;
  openArticle: (id: string) => void;
  closeArticle: () => void;
}

export function useHelpCenter(enabled: boolean): UseHelpCenterReturn {
  const pathname = usePathname() ?? '/';
  const [query, setQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [businessTypeLoaded, setBusinessTypeLoaded] = useState(false);

  useEffect(() => {
    setUser(authService.getUser());
  }, []);

  useEffect(() => {
    if (!enabled || businessTypeLoaded) return undefined;
    let active = true;
    setupOnboardingService.fetch()
      .then((state) => {
        if (active) setBusinessType(state.businessType);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setBusinessTypeLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [enabled, businessTypeLoaded]);

  const articles = useMemo(
    () => HELP_ARTICLES.filter((article) => canAccessPathname(user, stripQuery(article.link.href))),
    [user],
  );

  const results = useMemo(() => searchHelpArticles(articles, query), [articles, query]);

  const suggestions = useMemo(
    () => suggestHelpArticles(articles, pathname, businessType),
    [articles, pathname, businessType],
  );

  const groups = useMemo<HelpCategoryGroup[]>(
    () => HELP_CATEGORIES
      .map((category) => ({
        ...category,
        articles: articles.filter((article) => article.category === category.id),
      }))
      .filter((group) => group.articles.length > 0),
    [articles],
  );

  const activeArticle = useMemo(
    () => (activeArticleId ? findHelpArticle(articles, activeArticleId) : null),
    [articles, activeArticleId],
  );

  return {
    pathname,
    query,
    setQuery,
    results,
    suggestions,
    groups,
    activeArticle,
    openArticle: setActiveArticleId,
    closeArticle: () => setActiveArticleId(null),
  };
}
