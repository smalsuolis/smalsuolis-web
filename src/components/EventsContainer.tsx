import { useQuery } from '@tanstack/react-query';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { CONTENT_WIDTH, device, font } from '../styles';
import {
  App,
  Category,
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
import SritysFilterModal, { SritysValue } from './home/SritysFilterModal';
import Pagination from './Pagination';
import PeriodDropdown from './PeriodDropdown';
import Icon from './Icons';
import LoaderComponent from './LoaderComponent';
import Loader from './Loader';
import MapView from './MapView';
import { UserContext, UserContextType } from './UserProvider';
import { useAuthModal } from './auth/AuthModalContext';

// The feed's own filters. The map keeps its set under its own key — sharing one
// store made each surface inherit whatever the other was last showing.
const LIST_FILTERS_KEY = 'smalsuolis.listFilters';

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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Each surface remembers its own filters: arriving from the map applies what
  // the URL carries for that visit, but does not overwrite what the feed had.
  const [filtersValue, setFiltersValue] = useState<Filters>(() => {
    const carried =
      searchParams.has('apps') ||
      searchParams.has('range') ||
      searchParams.has('categories') ||
      searchParams.has('from');
    if (carried) return {};
    try {
      const raw = sessionStorage.getItem(LIST_FILTERS_KEY);
      return raw ? (JSON.parse(raw) as Filters) : {};
    } catch {
      return {};
    }
  });
  // Only what the user changes here is remembered. A handoff from the map also
  // lands in `filters`, and persisting that made the feed inherit the map's set.
  const userEdited = useRef(false);
  const filters = useMemo(
    () => ({
      value: filtersValue,
      setValue: (next: Filters) => {
        userEdited.current = true;
        setFiltersValue(next);
      },
    }),
    [filtersValue],
  );
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [search, setSearch] = useState(searchInput);

  const isListView = searchParams.get('view') === 'list';

  const { loggedIn } = useContext<UserContextType>(UserContext);
  const { open: openAuthModal } = useAuthModal();

  // Whether the URL has filter params that need to be loaded
  const hasUrlFilterParams =
    searchParams.has('apps') || searchParams.has('range') || searchParams.has('categories');
  const initFromUrlDone = useRef(!hasUrlFilterParams);
  // The sync effect below runs in the same commit as the hydration above, while
  // `filters.value` is still the pre-hydration one — writing it back would erase
  // the very params we just read. Skip that one run.
  const skipSyncAfterInit = useRef(false);

  // Fetch all apps so we can reconstruct filter objects from URL param IDs
  const { data: appsResponse } = useQuery({
    queryKey: ['apps', 'all'],
    queryFn: () => api.getAllApps(),
  });
  const allApps = useMemo(() => appsResponse ?? [], [appsResponse]);

  // Categories are static (seed-only) — fetch once, reuse for URL hydration
  // and any other consumers that need to map ids back to Category objects.
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories', 'all', 'infostatyba'],
    queryFn: () => api.getAllCategories('infostatyba'),
    staleTime: Infinity,
  });
  const allCategories = useMemo(() => categoriesResponse ?? [], [categoriesResponse]);

  const { data: subsResponse, isFetching: subResponseLoading } = useQuery({
    queryKey: ['allSubscriptions'],
    queryFn: () => api.getAllSubscriptions(),
    enabled: loggedIn && isMyEvents,
    refetchOnWindowFocus: false,
  });
  const allSubscriptions = useMemo(() => subsResponse ?? [], [subsResponse]);

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

    const item = rangeParam ? timeRangeItems.find((i) => i.key === rangeParam) : undefined;
    if (item) {
      newFilters.timeRange = item;
    } else {
      // The map names its periods differently, so it hands the window over as
      // dates. Same shape as an explicit CUSTOM selection.
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      if (from && to) {
        newFilters.timeRange = {
          key: TimeRanges.CUSTOM,
          name: 'Pasirinkite datą',
          query: { $gte: from, $lt: to },
        };
      }
    }

    skipSyncAfterInit.current = true;
    setFiltersValue(newFilters);
    // Reads the URL into filters. The raw setter is used on purpose: this write
    // is not a user edit, so it must not be remembered as the feed's own.
  }, [allApps, allCategories, allSubscriptions, searchParams]);

  // Sync filters to URL params whenever they change
  useEffect(() => {
    if (!initFromUrlDone.current) return;
    if (skipSyncAfterInit.current) {
      skipSyncAfterInit.current = false;
      return;
    }

    if (userEdited.current) {
      try {
        sessionStorage.setItem(LIST_FILTERS_KEY, JSON.stringify(filters.value));
      } catch {
        // Storage blocked: the filters still hold for this visit and in the URL.
      }
    }

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
      // An empty array is truthy: guard on length, or clearing the last chosen
      // source sends `app IN ()` and the list comes back empty for good.
      ...(apps?.length ? { app: { $in: apps.map((app) => app.id) } } : null),
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
  const [sritysOpen, setSritysOpen] = useState(false);

  // The dialog speaks in ids; the stored filter speaks in objects. Bridge the
  // two so both the dialog and the events query see the same selection.
  // The dialog's value is per-app; the stored filter is two flat lists that
  // cannot express it, so the dialog's own selection lives here and the stored
  // filter is derived from it. Rebuilding it from the flat lists dropped any
  // category ticked without its app and copied one row's leaves onto the others.
  const [sritysValue, setSritysValue] = useState<SritysValue>(() => ({
    appIds: (filters.value.apps ?? []).map((a) => a.id),
    categoriesByApp: {},
  }));

  // The seed above runs once, but the stored filter is only reconstructed from
  // the URL a tick later (it waits for the app and category lists). Without this
  // the dialog opened on whatever was current at mount — switching between the
  // map and the list showed a selection that no longer matched the query string.
  useEffect(() => {
    if (sritysOpen) return;
    const appIds = (filters.value.apps ?? []).map((a) => a.id);
    const live = new Set((filters.value.categories ?? []).map((c) => c.id));
    setSritysValue((prev) => {
      const categoriesByApp = Object.fromEntries(
        Object.entries(prev.categoriesByApp)
          .map(([appId, ids]) => [appId, ids.filter((id) => live.has(id))] as const)
          .filter(([, ids]) => ids.length),
      );
      const same =
        prev.appIds.length === appIds.length &&
        prev.appIds.every((id) => appIds.includes(id)) &&
        JSON.stringify(prev.categoriesByApp) === JSON.stringify(categoriesByApp);
      return same ? prev : { appIds, categoriesByApp };
    });
  }, [filters.value, sritysOpen]);

  const applySritys = (next: SritysValue) => {
    setSritysValue(next);
    const withCategories = Object.entries(next.categoriesByApp)
      .filter(([, ids]) => ids.length)
      .map(([id]) => Number(id));
    const appIds = Array.from(new Set([...next.appIds, ...withCategories]));
    const categoryIds = new Set(Object.values(next.categoriesByApp).flat());
    filters.setValue({
      ...filters.value,
      apps: appIds.map((id) => allApps.find((a: App) => a.id === id)).filter(Boolean) as App[],
      categories: allCategories.filter((c: Category) => categoryIds.has(c.id)),
    });
  };

  const sritysLabel = (() => {
    const picked = filters.value.apps ?? [];
    if (!picked.length) return 'Sritys';
    return picked.length === 1 ? picked[0].name : `${picked[0].name} +${picked.length - 1}`;
  })();

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

  // The debounce means the query has not started yet, but the user has already
  // typed — so the field counts as busy from the keystroke, not from the request.
  const searchPending = searchInput !== search || (isFetching && !!search);

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
      // Mid-fetch there is no answer yet, and "the feed is empty" is the wrong
      // one to show while typing a search that is still running.
      if (isFetching) return <LoaderComponent />;
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
  // See Map.goToList: the map keeps its own filters, so this only switches view.
  const goToMap = () => {
    navigate(slugs.map);
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
          {/* Covers the debounce too: from the keystroke until the rows land,
              the field is the thing the user is looking at. */}
          <SearchSpinner $visible={searchPending}>
            <Loader size="16px" color="#9AA4B2" />
          </SearchSpinner>
          {searchInput && (
            <ClearButton onClick={() => setSearchInput('')}>
              <Icon name={IconName.close} size={16} color={'#9AA4B2'} />
            </ClearButton>
          )}
        </SearchField>
        <InlineFilters>
          {/* The frame opens the same "Filtravimas pagal sritis" dialog the map
              uses from this control, rather than a flat single-select list. */}
          <SritysTrigger type="button" onClick={() => setSritysOpen(true)}>
            <SritysLabel>{sritysLabel}</SritysLabel>
            <Icon name={IconName.dropdownArrow} size={20} />
          </SritysTrigger>
          <PeriodDropdown
            placeholder="Data"
            options={timeRangeItems}
            value={filters.value.timeRange?.key ?? ''}
            selectedDates={filters.value.timeRange?.query}
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

      <SritysFilterModal
        visible={sritysOpen}
        value={sritysValue}
        onChange={applySritys}
        onApply={() => setSritysOpen(false)}
        onClose={() => setSritysOpen(false)}
      />
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

// Same 300x40 outlined pill the period control uses, but it opens a dialog.
const SritysTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.grey[500]};
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    flex-shrink: 0;
  }
`;

const SritysLabel = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
    /* The phone frame gives the stacked bar more air before the feed than the
       desktop row gets: 50 against the row's 24. */
    margin-bottom: 50px;
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

const SearchSpinner = styled.span<{ $visible: boolean }>`
  display: flex;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.15s ease;
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

// Design: search on the left, the Sritys dialog trigger and the period dropdown
// on the right — at every breakpoint. They stack under the search on phones.
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
