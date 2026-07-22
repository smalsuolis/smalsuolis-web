import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@aplinkosministerija/design-system';
import styled, { keyframes } from 'styled-components';
import { device, font } from '../../styles';
import { App, AppType, buttonsTitles, Category, filterModalTitle, IconName } from '../../utils';
import { timeRangeQuery, TimeRanges } from '../../utils/types';
import api from '../../utils/api';
import Icon from '../Icons';
import CategoryTree from './CategoryTree';

const ALL_TIME = timeRangeQuery[TimeRanges.ALL_TIME];

export interface SritysValue {
  appIds: number[];
  // Category selection is per-app: the 4 infostatyba apps (statyba / remontas /
  // griovimas / paskirties-keitimas) share the same category list but select it
  // independently. Keyed by app id → selected leaf category ids for that app.
  categoriesByApp: Record<number, number[]>;
}

interface Props {
  visible: boolean;
  value: SritysValue;
  onChange: (value: SritysValue) => void;
  onApply: () => void;
  onClose: () => void;
}

// "Filtravimas pagal sritis" modal. The event-type (app) checkbox list, plus the
// hierarchical infostatyba category tree (reusing the existing Categories
// component + selection logic). Shared by the homepage hero and the events/map
// page. Footer shows a live result count.
const SritysFilterModal = ({ visible, value, onChange, onApply, onClose }: Props) => {
  // Which top-level app rows are expanded (independent of their checked state).
  const [expandedApps, setExpandedApps] = useState<Set<number>>(new Set());

  const { data: apps = [] } = useQuery({
    queryKey: ['apps', 'all'],
    queryFn: () => api.getAllApps(),
    staleTime: Infinity,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'all', 'infostatyba'],
    queryFn: () => api.getAllCategories('infostatyba'),
    staleTime: Infinity,
  });

  // Total number of selectable leaf categories (for the infostatyba app's
  // empty/partial/full checkbox state).
  const categoryLeafIds = useMemo(() => {
    const hasChild = new Set(categories.map((c: Category) => c.parent).filter(Boolean));
    return categories
      .filter((c: Category) => !hasChild.has(c.id) && c.code !== 'kita' && !c.hidden)
      .map((c: Category) => c.id);
  }, [categories]);

  const toggleAppExpand = (id: number) =>
    setExpandedApps((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // All category ids selected across every app (per-app selections flattened).
  const allSelectedCategoryIds = useMemo(
    () => Object.values(value.categoriesByApp).flat(),
    [value.categoriesByApp],
  );

  // Apps that have at least one category selected.
  const appsWithCategories = useMemo(
    () =>
      Object.entries(value.categoriesByApp)
        .filter(([, ids]) => ids.length > 0)
        .map(([id]) => Number(id)),
    [value.categoriesByApp],
  );

  // Build the events query for the live count. Best-effort aggregate: match any
  // whole-selected app OR any app that has categories, narrowed by the union of
  // selected categories. (Per-app category precision would need an OR query the
  // count endpoint doesn't support; this is close enough for a live preview.)
  const query = useMemo(() => {
    const appIds = Array.from(new Set([...value.appIds, ...appsWithCategories]));
    return {
      ...(appIds.length ? { app: { $in: appIds } } : null),
      ...(allSelectedCategoryIds.length ? { categoryGroup: allSelectedCategoryIds } : null),
    };
  }, [value.appIds, appsWithCategories, allSelectedCategoryIds]);

  const hasFilters = value.appIds.length > 0 || allSelectedCategoryIds.length > 0;

  // Default (no filters) total: reuse the SAME cached query the homepage stat
  // row already loaded (api.getStats(ALL_TIME).count). Because it's shared cache,
  // the number is already in memory before the modal opens — it shows instantly,
  // no modal-specific request, no loading state.
  const { data: statsData } = useQuery({
    queryKey: ['home-stats', ALL_TIME],
    queryFn: () => api.getStats(ALL_TIME),
    staleTime: 5 * 60 * 1000,
  });

  // Filtered count: fetched fresh for the current filter query. No placeholder —
  // `data` is only ever the real result for the current query key (undefined
  // while a new query loads).
  const { data: filteredCount } = useQuery({
    queryKey: ['events', 'count', query],
    queryFn: () => api.getEventsCount({ query }),
    enabled: hasFilters,
    staleTime: 60 * 1000,
  });

  const freshCount = hasFilters ? filteredCount : statsData?.count;

  // Hold the last real count so the button never blanks while a new one loads;
  // it updates (and the label fades once) only when fresh data arrives.
  const [settledCount, setSettledCount] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (freshCount !== undefined) setSettledCount(freshCount);
  }, [freshCount]);

  // This app's own selected category ids (independent per app).
  const catsFor = (appId: number): number[] => value.categoriesByApp[appId] ?? [];

  const setCatsFor = (appId: number, ids: number[]) => {
    const next = { ...value.categoriesByApp };
    if (ids.length) next[appId] = ids;
    else delete next[appId];
    onChange({ ...value, categoriesByApp: next });
  };

  // An infostatyba app's checkbox is a parent over its category leaves: all
  // leaves selected → all, some → partial, none → none. Checking it cascades to
  // every leaf (they visibly tick). Non-infostatyba apps are simple on/off.
  const appState = (app: App): 'none' | 'partial' | 'all' => {
    const isInfostatyba = app.key.startsWith(AppType.INFO_CONSTRUCTION);
    if (!isInfostatyba) return value.appIds.includes(app.id) ? 'all' : 'none';
    const selected = catsFor(app.id).length;
    if (selected === 0) return 'none';
    if (selected >= categoryLeafIds.length) return 'all';
    return 'partial';
  };

  const toggleAppNode = (app: App) => {
    const isInfostatyba = app.key.startsWith(AppType.INFO_CONSTRUCTION);
    if (!isInfostatyba) {
      onChange({
        ...value,
        appIds: value.appIds.includes(app.id)
          ? value.appIds.filter((v) => v !== app.id)
          : [...value.appIds, app.id],
      });
      return;
    }
    // Toggle the whole infostatyba app: fully selected → clear all its
    // categories; otherwise → select ALL its category leaves (cascade down).
    const next = { ...value.categoriesByApp };
    if (appState(app) === 'all') {
      delete next[app.id];
    } else {
      next[app.id] = [...categoryLeafIds];
    }
    onChange({ ...value, categoriesByApp: next });
  };

  const clearAll = () => onChange({ appIds: [], categoriesByApp: {} });

  return (
    <Modal visible={visible} onClose={onClose}>
      <Panel>
        <Header>
          <Title>{filterModalTitle}</Title>
          <CloseButton onClick={onClose} aria-label={buttonsTitles.close}>
            <Icon name={IconName.close} />
          </CloseButton>
        </Header>

        <SectionLabel>Sritys</SectionLabel>

        <AppList>
          {apps.map((app: App) => {
            const isInfostatyba = app.key.startsWith(AppType.INFO_CONSTRUCTION);
            const hasChildren = isInfostatyba && categories.length > 0;
            const state = appState(app);
            const isOpen = expandedApps.has(app.id);
            return (
              <div key={app.id}>
                <AppRow>
                  <Checkbox
                    $state={state}
                    onClick={() => toggleAppNode(app)}
                    role="checkbox"
                    aria-checked={state === 'partial' ? 'mixed' : state === 'all'}
                  >
                    {state === 'all' && <Check />}
                    {state === 'partial' && <Dash />}
                  </Checkbox>
                  <AppName onClick={() => toggleAppNode(app)}>{app.name}</AppName>
                  {/* Any item with subitems is expandable, regardless of selection. */}
                  {hasChildren && (
                    <ExpandBtn onClick={() => toggleAppExpand(app.id)} aria-label="Išskleisti">
                      <Chevron name={IconName.dropdownArrow} $open={isOpen} />
                    </ExpandBtn>
                  )}
                </AppRow>
                {hasChildren && isOpen && (
                  <TreeWrap>
                    <CategoryTree
                      options={categories}
                      value={catsFor(app.id)}
                      onChange={(ids) => setCatsFor(app.id, ids)}
                    />
                  </TreeWrap>
                )}
              </div>
            );
          })}
        </AppList>

        <Footer>
          <ClearLink onClick={clearAll}>{buttonsTitles.clearAll}</ClearLink>
          <ApplyButton onClick={onApply}>
            {/* Show the last SETTLED count and key the fade on it, so the label
                fades exactly once — when the real number lands — never toward a
                stale placeholder. */}
            <FadeText key={settledCount ?? 'none'}>
              {settledCount === undefined
                ? 'Rodyti rezultatus'
                : buttonsTitles.showResults(settledCount)}
            </FadeText>
          </ApplyButton>
        </Footer>
      </Panel>
    </Modal>
  );
};

export default SritysFilterModal;

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.white};
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;

  @media ${device.desktop} {
    max-width: 640px;
    height: auto;
    max-height: 80vh;
    border-radius: 20px;
    padding: 32px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.div`
  ${font('2xl', 700)};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  display: flex;
  font-size: 2.4rem;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

const SectionLabel = styled.div`
  ${font('base', 700)};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 12px;
`;

const AppList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
`;

const AppRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[300]};
`;

const Checkbox = styled.span<{ $state: 'none' | 'partial' | 'all' }>`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid
    ${({ $state, theme }) => ($state === 'none' ? theme.colors.grey[500] : theme.colors.primary)};
  background: ${({ $state, theme }) => ($state === 'none' ? 'transparent' : theme.colors.primary)};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Dash = styled.span`
  width: 10px;
  height: 2px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.text.primary};
`;

// CSS-drawn checkmark with a 2px stroke to match the Dash weight (the icon-font
// check rendered too heavy next to the thin dash).
const Check = styled.span`
  width: 6px;
  height: 11px;
  margin-top: -2px;
  border: solid ${({ theme }) => theme.colors.text.primary};
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
`;

const AppName = styled.span`
  ${font('base', 500)};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  flex: 1;
`;

const ExpandBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  background: transparent;
  flex-shrink: 0;
`;

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
`;

const TreeWrap = styled.div`
  padding: 4px 0 8px 34px;

  @media ${device.mobileL} {
    padding-left: 16px;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
`;

const ClearLink = styled.button`
  ${font('base', 500)};
  color: ${({ theme }) => theme.colors.tertiary};
  text-decoration: underline;
  cursor: pointer;
  background: transparent;
`;

const ApplyButton = styled.button`
  ${font('base', 500)};
  padding: 14px 28px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  white-space: nowrap;
`;

const fadeIn = keyframes`
  from { opacity: 0.35; }
  to { opacity: 1; }
`;

// Remounted (via key) whenever the count changes, so the new number fades in
// instead of snapping. ~150ms, subtle.
const FadeText = styled.span`
  display: inline-block;
  animation: ${fadeIn} 0.15s ease-out;
`;
