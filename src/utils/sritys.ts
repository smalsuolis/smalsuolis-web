import { useMemo } from 'react';
import { App, AppType, Category } from '.';

// Shared helpers for the "sritys" checkbox list (SritysCheckList) and the
// filter/subscription modals that host it.

export type NodeState = 'none' | 'partial' | 'all';

// Only the construction apps carry the nested category tree.
export const isInfostatyba = (app: App) => !!app.key?.startsWith(AppType.INFO_CONSTRUCTION);

// Every selectable leaf id in the category forest (excludes the "kita" branch
// and hidden nodes, matching CategoryTree's own filtering).
export const useCategoryLeafIds = (categories: Category[]) =>
  useMemo(() => {
    const hasChild = new Set(categories.map((c) => c.parent).filter(Boolean));
    return categories
      .filter((c) => !hasChild.has(c.id) && c.code !== 'kita' && !c.hidden)
      .map((c) => c.id);
  }, [categories]);
