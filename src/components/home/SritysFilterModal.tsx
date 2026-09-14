import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@aplinkosministerija/design-system';
import styled, { keyframes } from 'styled-components';
import { device, font } from '../../styles';
import { App, AppType, buttonsTitles, Category, filterModalTitle, IconName } from '../../utils';
import { timeRangeQuery, TimeRanges } from '../../utils/types';
import api from '../../utils/api';
import Icon from '../Icons';
import SritysCheckList from '../SritysCheckList';
import Loader from '../Loader';
import { useCategoryLeafIds } from '../../utils/sritys';

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
  const categoryLeafIds = useCategoryLeafIds(categories);

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
  const { data: statsData, isFetching: statsFetching } = useQuery({
    queryKey: ['home-stats', ALL_TIME],
    queryFn: () => api.getStats(ALL_TIME),
    staleTime: 5 * 60 * 1000,
  });

  // Filtered count: fetched fresh for the current filter query. No placeholder —
  // `data` is only ever the real result for the current query key (undefined
  // while a new query loads).
  const { data: filteredCount, isFetching: filteredFetching } = useQuery({
    queryKey: ['events', 'count', query],
    queryFn: () => api.getEventsCount({ query }),
    enabled: hasFilters,
    staleTime: 60 * 1000,
  });

  const freshCount = hasFilters ? filteredCount : statsData?.count;
  // Ticking a row refetches the count, and the button kept showing the previous
  // number until it landed. Say it is working instead of looking already done.
  const countLoading = hasFilters ? filteredFetching : statsFetching;

  // Hold the last real count so the button never blanks while a new one loads;
  // it updates (and the label fades once) only when fresh data arrives.
  const [settledCount, setSettledCount] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (freshCount !== undefined) setSettledCount(freshCount);
  }, [freshCount]);

  // Toggling an expandable row reports its app id AND its categories in the same
  // tick. Both handlers derive from `value`, which is still the pre-click one for
  // the second of them — so they compose through this ref instead, or the second
  // update would undo the first and the row would never tick.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const apply = (patch: Partial<SritysValue>) => {
    latest.current = { ...latest.current, ...patch };
    onChange(latest.current);
  };

  // This app's own selected category ids (independent per app).
  const catsFor = (appId: number): number[] => value.categoriesByApp[appId] ?? [];

  const setCatsFor = (appId: number, ids: number[]) => {
    const next = { ...latest.current.categoriesByApp };
    if (ids.length) next[appId] = ids;
    else delete next[appId];
    apply({ categoriesByApp: next });
  };

  const clearAll = () => {
    latest.current = { appIds: [], categoriesByApp: {} };
    onChange(latest.current);
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <Panel data-modal-card>
        <Header>
          <Title>{filterModalTitle}</Title>
          <CloseButton onClick={onClose} aria-label={buttonsTitles.close}>
            <Icon name={IconName.close} />
          </CloseButton>
        </Header>

        <SectionLabel>Sritys</SectionLabel>

        <AppList>
          <SritysCheckList
            apps={apps}
            categories={categories}
            appIds={value.appIds}
            onAppIdsChange={(ids) => apply({ appIds: ids })}
            catsFor={catsFor}
            onCatsChange={setCatsFor}
          />
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
            {/* The slot is always there, so showing the spinner cannot shift the
                label under the pointer. */}
            <Spinner $visible={countLoading} aria-hidden={!countLoading}>
              <Loader size="16px" color="#ffffff" />
            </Spinner>
          </ApplyButton>
        </Footer>
      </Panel>
    </Modal>
  );
};

export default SritysFilterModal;

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.white};
  /* Keeps its 16px gutters on a viewport narrower than the 361 phone frame,
     rather than running flush to both edges with rounded corners cut off. */
  width: calc(100% - 32px);
  max-width: 361px;
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  border-radius: 8px;
  overflow-y: auto;

  @media ${device.desktop} {
    max-width: 841px;
    max-height: 80vh;
    padding: 24px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const Title = styled.div`
  ${font('2xl')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  padding: 0;
  display: flex;
  font-size: 2.4rem;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

const SectionLabel = styled.div`
  ${font('base', 600)};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;
`;

const AppList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
`;

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
`;

// Full-bleed bar across the panel's foot, per the design: it escapes the
// panel's padding so its rule reaches both edges.
// The phone frame stacks and centres the pair; the wide one keeps them apart.
const Footer = styled.div`
  display: flex;
  /* The phone frame puts the action first and "Išvalyti viską" under it; the
     source order stays link-then-button for the desktop row. */
  flex-direction: column-reverse;
  align-items: center;
  gap: 24px;
  margin: 24px -16px -24px;
  padding: 24px 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};

  @media ${device.desktop} {
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    margin: 24px -24px -24px;
    padding: 24px;
  }
`;

const ClearLink = styled.button`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: underline;
  cursor: pointer;
  background: transparent;
`;

const ApplyButton = styled.button`
  ${font('base')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 205px;
  height: 40px;
  padding: 8px 24px;
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  white-space: nowrap;
`;

const Spinner = styled.span<{ $visible: boolean }>`
  display: flex;
  width: 16px;
  height: 16px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.15s ease;
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
