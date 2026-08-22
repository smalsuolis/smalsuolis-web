import { useStorage } from '@aplinkosministerija/design-system';
import { useQuery } from '@tanstack/react-query';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { CONTENT_WIDTH, device, font } from '../styles';
import {
  App,
  buttonsTitles,
  Event,
  Filters,
  IconName,
  inputLabels,
  isEmpty,
  slugs,
  Subscription,
  TimeRangeItem,
  timeRangeItems,
  useGetCurrentRoute,
} from '../utils';
import { TimeRanges } from '../utils/types';
import api from '../utils/api';
import EmptyState from './EmptyState';
import EventRow, { EventRowList } from './EventRow';
import EventModal from './EventModal';
import Pagination from './Pagination';
import PeriodDropdown from './PeriodDropdown';
import Icon from './Icons';
import LoaderComponent from './LoaderComponent';
import MapView from './MapView';
import { UserContext, UserContextType } from './UserProvider';
import { useAuthModal } from './auth/AuthModalContext';

const EventsContainer = ({
  isMyEvents = false,
  apiEndpoint,
  countEndpoint,
  queryKey,
  emptyStateDescription,
  emptyStateTitle,
}: {
  isMyEvents?: boolean;
  apiEndpoint: any;
  countEndpoint: any;
  queryKey: string;
  emptyStateDescription?: string;
  emptyStateTitle: string;
}) => {
  const filters = useStorage<Filters>('filters', {}, true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [search, setSearch] = useState(searchInput);

  const isListView = searchParams.get('view') === 'list';

  const { loggedIn } = useContext<UserContextType>(UserContext);
  const { open: openAuthModal } = useAuthModal();

  // Whether the URL has filter params that need to be loaded
  const hasUrlFilterParams =
    searchParams.has('apps') || searchParams.has('range') || searchParams.has('categories');
  const initFromUrlDone = useRef(!hasUrlFilterParams);

  // Fetch all apps so we can reconstruct filter objects from URL param IDs
  const { data: appsResponse } = useQuery({
    queryKey: ['apps', 'all'],
    queryFn: () => api.getAllApps(),
  });
  const allApps = appsResponse ?? [];

  // Categories are static (seed-only) — fetch once, reuse for URL hydration
  // and any other consumers that need to map ids back to Category objects.
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories', 'all', 'infostatyba'],
    queryFn: () => api.getAllCategories('infostatyba'),
    staleTime: Infinity,
  });
  const allCategories = categoriesResponse ?? [];

  const { data: subsResponse, isFetching: subResponseLoading } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: () => api.getAllSubscriptions(),
    enabled: loggedIn && isMyEvents,
    refetchOnWindowFocus: false,
  });
  const allSubscriptions = subsResponse ?? [];

  // Initialize filters from URL params (runs once when data is ready)
  useEffect(() => {
    if (initFromUrlDone.current) return;

    const appsParam = searchParams.get('apps');
    const rangeParam = searchParams.get('range');
    const categoriesParam = searchParams.get('categories');

    // Wait for the relevant lookup data before resolving ids → objects.
    if (appsParam && !allApps.length) return;
    if (categoriesParam && !allCategories.length) return;

    initFromUrlDone.current = true;

    const newFilters: Filters = {};

    if (appsParam) {
      const appIds = appsParam.split(',').map(Number);
      newFilters.apps = allApps.filter((a) => appIds.includes(a.id));
    }

    if (categoriesParam) {
      const ids = categoriesParam.split(',').map(Number);
      newFilters.categories = allCategories.filter((c) => ids.includes(c.id));
    }

    if (rangeParam) {
      if (rangeParam === TimeRanges.CUSTOM) {
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        if (from && to) {
          newFilters.timeRange = {
            key: TimeRanges.CUSTOM,
            name: 'Pasirinkite datą',
            query: { $gte: from, $lt: to },
          };
        }
      } else {
        const item = timeRangeItems.find((i) => i.key === rangeParam);
        if (item) {
          newFilters.timeRange = item;
        }
      }
    }

    filters.setValue(newFilters);
    // Reads the URL into filters. `filters` is written here, so listing it as
    // a dependency would re-enter this effect on its own write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allApps, allCategories, allSubscriptions, searchParams]);

  // Sync filters to URL params whenever they change
  useEffect(() => {
    if (!initFromUrlDone.current) return;

    setSearchParams(
      (prev) => {
        const { apps, timeRange, categories } = filters.value;
        const isCustom = timeRange?.key === TimeRanges.CUSTOM;

        const next: Record<string, string | null> = {
          apps: apps?.length ? apps.map((a) => a.id).join(',') : null,
          categories: categories?.length ? categories.map((c) => c.id).join(',') : null,
          range: timeRange ? timeRange.key : null,
          from: isCustom ? timeRange.query.$gte : null,
          to: isCustom ? timeRange.query.$lt : null,
        };

        // Compare BEFORE writing: this effect also runs on mount, and a shared
        // ?apps=1&page=3 link must keep its page.
        const changed = Object.entries(next).some(
          ([key, value]) => (prev.get(key) ?? null) !== value,
        );

        Object.entries(next).forEach(([key, value]) => {
          if (value === null) prev.delete(key);
          else prev.set(key, value);
        });

        // A changed filter invalidates the current page number.
        if (changed) prev.delete('page');

        return prev;
      },
      { replace: true },
    );
    // Mirrors filters into the URL. setSearchParams is re-created whenever the
    // location changes — which this effect causes — so depending on it would
    // loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setSearchParams(
        (prev) => {
          // Compare BEFORE writing: this effect also runs on mount, and a
          // shared ?q=…&page=3 link must keep its page.
          const changed = searchInput !== (prev.get('q') ?? '');
          if (searchInput) {
            prev.set('q', searchInput);
          } else {
            prev.delete('q');
          }
          if (changed) prev.delete('page');
          return prev;
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(timer);
    // Debounced search → URL. Same reason as above: setSearchParams changes
    // identity on the navigation this effect performs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const currentRoute = useGetCurrentRoute();
  const listTopRef = useRef<HTMLDivElement>(null);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const getFilter = () => {
    const { apps, timeRange, subscriptions, categories } = filters.value;
    let filterSubs: Subscription[] = [];
    if (isMyEvents) {
      filterSubs = subscriptions && subscriptions.length ? subscriptions : allSubscriptions;
    }
    return {
      ...(apps ? { app: { $in: apps.map((app) => app.id) } } : null),
      ...(filterSubs.length ? { subscription: { $in: filterSubs.map((sub) => sub.id) } } : null),
      // categoryGroup expands selected categories' subtrees server-side, so a
      // user picking 'pastatai' transparently matches all leaves under it.
      ...(categories?.length ? { categoryGroup: categories.map((c) => c.id) } : null),
      ...(timeRange ? { startAt: timeRange.query } : null),
      ...(search
        ? {
            $raw: {
              condition: '(events.name ilike ? OR events.body ilike ?)',
              bindings: [`%${search}%`, `%${search}%`],
            },
          }
        : null),
    };
  };

  const getMapGeom = () => {
    if (!allSubscriptions.length || !isMyEvents) return null;

    const { subscriptions } = filters.value;

    const currentSubscriptions = subscriptions ? subscriptions : allSubscriptions;

    return {
      type: 'FeatureCollection',
      features: currentSubscriptions.map((sub) => sub?.geom?.features[0]),
    };
  };

  // The inline mobile app filter is single-select (the frame shows one value in
  // the pill); multi-select stays in the modal. Reuses PeriodDropdown's shape.
  const appOptions = allApps.map((app: App) => ({
    key: String(app.id),
    name: app.name,
    query: {} as any,
  }));
  const selectedAppKey = filters.value.apps?.length === 1 ? String(filters.value.apps[0].id) : '';

  // Paged (not infinite) so any page is linkable: ?page=N rides alongside the
  // existing q / apps / range / categories params.
  const {
    data: events,
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: [queryKey, filters.value, search, page],
    queryFn: () => apiEndpoint({ query: getFilter(), page }),
    enabled: isListView,
    placeholderData: (previous: any) => previous,
  });

  const setPage = (next: number) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next > 1) params.set('page', String(next));
        else params.delete('page');
        return params;
      },
      { replace: false },
    );
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderListContent = () => {
    if (isEmpty(events?.rows)) {
      return (
        <EmptyState
          title={emptyStateTitle}
          description={emptyStateDescription}
          icon={IconName.airBallon}
        />
      );
    }
    return (
      <InnerContainer>
        <EventRowList>
          {events?.rows.map((event: Event) => (
            <EventRow key={event.id} event={event} onSelect={setSelectedEvent} />
          ))}
        </EventRowList>
        {isFetching && <LoaderComponent />}
        <Pagination page={page} totalPages={events?.totalPages ?? 1} onChange={setPage} />
      </InnerContainer>
    );
  };

  const renderListOrMap = () => {
    if (isLoading || subResponseLoading) return <LoaderComponent />;

    if (isListView) {
      return renderListContent();
    } else {
      const mapFilters = getFilter();
      const geom = getMapGeom();
      return <MapView filters={mapFilters} geom={geom} />;
    }
  };

  // "Rodyti žemėlapį" goes back to the full-size map page, carrying the current
  // filters over. The two pages name some params differently (map: ?app= &
  // ?range=, list: ?apps= & ?range=), so translate rather than pass through.
  const goToMap = () => {
    const params = new URLSearchParams();
    const { apps, categories, timeRange } = filters.value;

    if (apps?.length) params.set('app', apps.map((a) => a.id).join(','));
    if (categories?.length) params.set('categories', categories.map((c) => c.id).join(','));
    if (timeRange) params.set('range', timeRange.key);

    const query = params.toString();
    navigate(query ? `${slugs.map}?${query}` : slugs.map);
  };

  const toggleView = () => {
    if (isListView) {
      // Mano įvykiai renders its own map, scoped to the user's subscriptions —
      // leaving for the global map page would drop that scope. Only the
      // all-events list hands off to /zemelapis.
      if (isMyEvents) {
        setSearchParams(
          (prev) => {
            prev.delete('view');
            return prev;
          },
          { replace: true },
        );
        return;
      }
      goToMap();
      return;
    }
    setSearchParams(
      (prev) => {
        prev.set('view', 'list');
        return prev;
      },
      { replace: true },
    );
  };

  return (
    <Page ref={listTopRef}>
      <Header>
        <PageTitle>{currentRoute?.title ?? 'Naujausi įvykiai'}</PageTitle>
        <HeaderActions>
          {!loggedIn && (
            <RegisterCta onClick={() => openAuthModal('register')}>
              Dar neturite paskyros? Užsiregistruokite
            </RegisterCta>
          )}
          <ViewToggle onClick={toggleView}>
            <Icon name={isListView ? IconName.map : IconName.list} size={20} color={'white'} />
            {isListView ? buttonsTitles.showMap : buttonsTitles.showList}
          </ViewToggle>
        </HeaderActions>
      </Header>

      <HeaderRule />

      <FilterBar>
        <SearchField>
          <Icon name={IconName.search} size={18} color={'#9AA4B2'} />
          <SearchInput
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={inputLabels.searchEvents}
          />
          {searchInput && (
            <ClearButton onClick={() => setSearchInput('')}>
              <Icon name={IconName.close} size={16} color={'#9AA4B2'} />
            </ClearButton>
          )}
        </SearchField>
        {/* Mobile shows the two most-used filters inline (per the Figma frame)
            so the active selection is visible without opening the modal; the
            pill stays for everything else. Desktop keeps the pill alone. */}
        <InlineFilters>
          <PeriodDropdown
            placeholder="Sritys"
            options={appOptions}
            value={selectedAppKey}
            onChange={(option) => {
              const app = allApps.find((a) => String(a.id) === option.key);
              filters.setValue({
                ...filters.value,
                apps: app ? [app] : undefined,
              });
            }}
          />
          <PeriodDropdown
            placeholder="Data"
            options={timeRangeItems}
            value={filters.value.timeRange?.key ?? ''}
            onChange={(option) =>
              filters.setValue({
                ...filters.value,
                timeRange: option as TimeRangeItem,
              })
            }
          />
        </InlineFilters>
      </FilterBar>

      {renderListOrMap()}

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </Page>
  );
};

export default EventsContainer;

// Wide, left-aligned page shell (redesigned "Naujausi įvykiai"), replacing the
// old narrow centered DS layout.
const Page = styled.div`
  width: 100%;
  max-width: ${CONTENT_WIDTH};
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 0 32px;

  @media ${device.mobileL} {
    padding: 0 16px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PageTitle = styled.h1`
  ${font('3xl')};
  margin: 0;
`;

// Design: a 1px rule sits 36px under the header and 36px above the filter row.
const HeaderRule = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.grey[300]};
  margin: 36px 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
  }
`;

const RegisterCta = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 300px;
  height: 40px;
  padding: 7px 11px;
  white-space: nowrap;
  border-radius: 54px;
  border: 1px solid ${({ theme }) => theme.colors.grey[600]};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text.primary};
  ${font('base')};
  cursor: pointer;

  @media ${device.mobileL} {
    width: 100%;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const ViewToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 186px;
  height: 40px;
  padding: 8px 24px;
  white-space: nowrap;
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base')};
  cursor: pointer;

  @media ${device.mobileL} {
    width: 100%;
  }

  &:hover {
    opacity: 0.92;
  }
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
  }
`;

// Design: a fixed 422x40 field, not a flexible one — the two dropdowns keep
// their own widths against the right edge and the space between simply grows.
const SearchField = styled.div`
  flex: none;
  width: 422px;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.grey[500]};
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.white};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.grey[600]};
  }

  /* The row's fixed widths add up to more than a tablet's content column. The
     dropdowns keep theirs; the address field gives up its 422 and takes what is
     left, so nothing runs past the right edge. */
  @media ${device.tablet} {
    /* Shrink only — growing past 422 would widen it below the breakpoint. */
    flex: 0 1 422px;
    width: auto;
    min-width: 0;
  }

  @media ${device.mobileL} {
    width: 100%;
    flex: none;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.grey[500]};
  }
`;

const ClearButton = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
`;

// Inline dropdowns are a mobile-only affordance; on desktop the filter modal
// carries everything and the bar stays a search field + pill.
// Design: search on the left, category + period dropdowns on the right — at
// every breakpoint, not just mobile. They stack under the search on phones.
const InlineFilters = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;

  /* Design widths for the two dropdowns; they are fixed, not shrink-to-fit. */
  > *:nth-child(1) {
    width: 300px;
  }
  > *:nth-child(2) {
    width: 184px;
  }

  @media ${device.mobileL} {
    width: 100%;
    margin-left: 0;
    flex-direction: column;
    align-items: stretch;

    > *:nth-child(1),
    > *:nth-child(2) {
      width: 100%;
    }
  }
`;

const InnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
