import { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import proj4 from 'proj4';
import styled from 'styled-components';
import MapView from '../components/MapView';
import AddressAutocomplete from '../components/home/AddressAutocomplete';
import SritysFilterModal, { SritysValue } from '../components/home/SritysFilterModal';
import PeriodDropdown from '../components/PeriodDropdown';
import { device, font } from '../styles';
import { AddressSuggestion, App, Category, IconName, slugs } from '../utils';
import { statsTimeRangeItems, TimeRanges } from '../utils/types';
import Icon from '../components/Icons';
import api from '../utils/api';
import { UserContext, UserContextType } from '../components/UserProvider';
import { useAuthModal } from '../components/auth/AuthModalContext';

// The smalsuolis map iframe draws incoming geometry with dataProjection EPSG:3346
// (LKS94) — hardcoded in its route. Address suggestions come in EPSG:4326
// (lng/lat), so we must convert to 3346 before sending, or the point lands far
// off-map and the view goes grey. Register the LKS94 definition for proj4.
proj4.defs(
  'EPSG:3346',
  '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9998 +x_0=500000 +y_0=0 ' +
    '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);

// A searched address is one place, so send one point and let the iframe pin it.
// The extent it fits to is a small square around that point: without it the
// frame zooms a single coordinate to its maximum level and the street
// disappears. 400 m keeps the surrounding block in view.
const ADDRESS_EXTENT_M = 400;

const REGISTER_CARD_DISMISSED = 'smalsuolis.registerCardDismissed';

// The URL carries the filters when you switch to the list and back, but coming
// back through the navbar has no params to carry them — so the last set is kept
// for the session too, and used only when the URL says nothing.
const MAP_FILTERS_KEY = 'smalsuolis.mapFilters';

type StoredMapFilters = {
  address?: string;
  point?: [number, number];
  appIds?: number[];
  categoriesByApp?: Record<number, number[]>;
  periodKey?: string;
  customRange?: { $gte: string; $lt: string };
};

const readStoredFilters = (): StoredMapFilters => {
  try {
    return JSON.parse(sessionStorage.getItem(MAP_FILTERS_KEY) || '{}');
  } catch {
    return {};
  }
};

const addressFeatureCollection3346 = (geometry: AddressSuggestion['geometry']) => {
  const [lng, lat] = geometry.coordinates;
  const [cx, cy] = proj4('EPSG:4326', 'EPSG:3346', [lng, lat]);
  const r = ADDRESS_EXTENT_M;
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [cx, cy] }, properties: {} },
    ],
    // Some renderers fit to a bbox when one is present; harmless when ignored.
    bbox: [cx - r, cy - r, cx + r, cy + r],
  };
};

// Period options for the map: the shared preset ranges, minus the year/custom
// entries (kept simple for a floating dropdown).
const PERIOD_OPTIONS = statsTimeRangeItems.filter((i) =>
  [
    TimeRanges.LAST_7_DAYS,
    TimeRanges.LAST_28_DAYS,
    TimeRanges.LAST_90_DAYS,
    TimeRanges.LAST_365_DAYS,
    TimeRanges.ALL_TIME,
    TimeRanges.CUSTOM,
  ].includes(i.key as TimeRanges),
);

// Redesigned map page: the events map (maps.biip.lt iframe) fills the viewport,
// with three floating controls overlaid — address search, category (Sritys)
// filter, and a time-period dropdown. Address centers the map; Sritys + period
// narrow the events shown. URL state (?address=&app=&range=) keeps it linkable.
const MapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loggedIn } = useContext<UserContextType>(UserContext);
  const { open: openAuthModal } = useAuthModal();

  const navState = location.state as {
    address?: string;
    suggestion?: AddressSuggestion;
    // Full Sritys selection carried from the homepage hero (apps + per-app
    // categories), so category filters arrive pre-applied too. `appIds` is the
    // older shape kept as a fallback.
    srities?: SritysValue;
    appIds?: number[];
  } | null;

  // Read once: later renders must not resurrect a filter the user just cleared.
  const storedRef = useRef<StoredMapFilters>(readStoredFilters());
  const urlHasFilters =
    searchParams.has('address') ||
    searchParams.has('lat') ||
    searchParams.has('app') ||
    searchParams.has('categories') ||
    searchParams.has('range');
  const stored = urlHasFilters ? {} : storedRef.current;

  const [address, setAddress] = useState(
    navState?.address ?? searchParams.get('address') ?? stored.address ?? '',
  );
  // The resolved point travels with the address. Re-searching the text to find
  // it again returned the first match, not the one that was picked — "Antakalnio
  // g. 1" led with "Antakalnio g. 17", so the map zoomed to the wrong street.
  const pointFromUrl = ((): [number, number] | undefined => {
    const lng = Number(searchParams.get('lng'));
    const lat = Number(searchParams.get('lat'));
    return lng && lat ? [lng, lat] : undefined;
  })();
  const point = pointFromUrl ?? stored.point;

  const [selected, setSelected] = useState<AddressSuggestion | null>(
    navState?.suggestion ??
      (point && (searchParams.get('address') ?? stored.address)
        ? {
            code: 0,
            label: (searchParams.get('address') ?? stored.address)!,
            geometry: { type: 'Point', coordinates: point },
          }
        : null),
  );
  // Bumped when an address is cleared, to remount the map iframe back to its
  // default view (the iframe's zoomToFeatureCollection ignores empty geometry,
  // so there's no message to "unzoom" — a fresh mount is the reliable reset).
  const [mapKey, setMapKey] = useState(0);

  const clearSelection = () => {
    setSelected(null);
    setAddress('');
    setMapKey((k) => k + 1);
  };
  const [srities, setSrities] = useState<SritysValue>(() => {
    // Prefer the full selection from the hero (apps + categories); fall back to
    // the legacy appIds state, then the ?app= URL param.
    if (navState?.srities) return navState.srities;
    const appIds =
      navState?.appIds ??
      (searchParams.get('app')
        ? searchParams.get('app')!.split(',').map(Number).filter(Boolean)
        : stored.appIds ?? []);
    const categoryIds = (searchParams.get('categories') ?? '')
      .split(',')
      .map(Number)
      .filter(Boolean);
    if (!categoryIds.length && stored.categoriesByApp) {
      return { appIds, categoriesByApp: stored.categoriesByApp };
    }
    const categoriesByApp: Record<number, number[]> = {};
    if (categoryIds.length) appIds.forEach((id: number) => (categoriesByApp[id] = categoryIds));
    return { appIds, categoriesByApp };
  });
  const [filterOpen, setFilterOpen] = useState(false);
  // The phone frame replaces the register pill with a dismissible card over the
  // map. Dismissing it sticks: it is a prompt, and re-covering a third of the
  // map on every visit after the user said no is what made it feel intrusive.
  const [registerCardOpen, setRegisterCardOpen] = useState(() => {
    try {
      return localStorage.getItem(REGISTER_CARD_DISMISSED) !== '1';
    } catch {
      return true;
    }
  });

  const dismissRegisterCard = () => {
    setRegisterCardOpen(false);
    try {
      localStorage.setItem(REGISTER_CARD_DISMISSED, '1');
    } catch {
      // A browser with storage blocked just shows the card again next visit.
    }
  };
  // A range from the events page belongs to a different vocabulary, so anything
  // this page cannot render falls back to its own default rather than blanking.
  const [periodKey, setPeriodKey] = useState<string>(() => {
    const fromUrl = searchParams.get('range');
    if (PERIOD_OPTIONS.some((p) => p.key === fromUrl)) return fromUrl!;
    if (searchParams.get('from')) return TimeRanges.CUSTOM;
    return stored.periodKey ?? TimeRanges.LAST_28_DAYS;
  });

  // The feed and the map name their periods differently, so a selection travels
  // between them as the dates themselves and lands here as a custom range.
  const [customRange, setCustomRange] = useState<{ $gte: string; $lt: string } | undefined>(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from && to) return { $gte: from, $lt: to };
    return stored.customRange;
  });

  const appIds = srities.appIds;
  const selectedCategoryIds = useMemo(
    () => Object.values(srities.categoriesByApp).flat(),
    [srities.categoriesByApp],
  );

  // Data for the category pill label (resolve ids → names).
  const { data: apps = [] } = useQuery({
    queryKey: ['apps', 'all'],
    queryFn: () => api.getApps({ page: 1 }).then((r) => r.rows),
    staleTime: Infinity,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'all', 'infostatyba'],
    queryFn: () => api.getAllCategories('infostatyba'),
    staleTime: Infinity,
  });

  // Only for a link that carries the text without the point: match the label
  // exactly rather than taking whatever comes back first.
  useEffect(() => {
    const urlAddress = searchParams.get('address');
    if (!selected && urlAddress && urlAddress.trim().length >= 3) {
      api
        .suggestAddresses(urlAddress)
        .then((results) => {
          const exact = results.find((r) => r.label === urlAddress);
          if (exact) setSelected(exact);
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync with the current selection/filters.
  useEffect(() => {
    const next: Record<string, string> = {};
    if (address) next.address = address;
    if (selected) {
      next.lng = String(selected.geometry.coordinates[0]);
      next.lat = String(selected.geometry.coordinates[1]);
    }
    if (appIds.length) next.app = appIds.join(',');
    if (selectedCategoryIds.length) next.categories = selectedCategoryIds.join(',');
    if (periodKey) next.range = periodKey;
    if (periodKey === TimeRanges.CUSTOM && customRange) {
      next.from = customRange.$gte;
      next.to = customRange.$lt;
    }
    setSearchParams(next, { replace: true });
    try {
      sessionStorage.setItem(
        MAP_FILTERS_KEY,
        JSON.stringify({
          address,
          appIds,
          categoriesByApp: srities.categoriesByApp,
          periodKey,
          customRange,
        }),
      );
    } catch {
      // Storage blocked: the URL still carries everything between the two views.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, selected, appIds, selectedCategoryIds, periodKey, customRange]);

  // Switch to the list view, carrying the current filters. The events page uses
  // different param names than the map (?apps= vs ?app=), and reads them via
  // its own URL-init effect, so translate here.
  const goToList = () => {
    const params = new URLSearchParams({ view: 'list' });
    // The feed has nowhere to show an address, but it is still part of what the
    // user set up here — carry it so coming back lands on the same place.
    if (address) params.set('address', address);
    if (selected) {
      params.set('lng', String(selected.geometry.coordinates[0]));
      params.set('lat', String(selected.geometry.coordinates[1]));
    }
    if (appIds.length) params.set('apps', appIds.join(','));
    if (selectedCategoryIds.length) params.set('categories', selectedCategoryIds.join(','));
    // The key means nothing on the feed, so send the window it resolves to.
    if (period && period.key !== TimeRanges.ALL_TIME) {
      params.set('from', period.query.$gte);
      params.set('to', period.query.$lt);
    }
    navigate(`${slugs.events}?${params.toString()}`);
  };

  // When an address is selected, pin it (deselect handling that resets the view
  // lives in MapView, so an unset selection posts nothing).
  const geom = useMemo(
    () => (selected ? addressFeatureCollection3346(selected.geometry) : undefined),
    [selected],
  );

  const period = useMemo(
    () =>
      periodKey === TimeRanges.CUSTOM && customRange
        ? { key: TimeRanges.CUSTOM, name: 'Pasirinkite datą', query: customRange }
        : PERIOD_OPTIONS.find((p) => p.key === periodKey),
    [periodKey, customRange],
  );

  // Map filters: apps + selected categories + time range (startAt). The maps
  // iframe already understands `app`, `category`, and `startAt`.
  const filters = useMemo(() => {
    const f: any = {};
    if (appIds.length) f.app = { $in: appIds };
    if (selectedCategoryIds.length) f.category = { $in: selectedCategoryIds };
    if (period && period.key !== TimeRanges.ALL_TIME) f.startAt = period.query;
    return Object.keys(f).length ? f : undefined;
  }, [appIds, selectedCategoryIds, period]);

  // Category pill label: first selected category name, else first app name,
  // else the generic "Sritys" — with a +N suffix when more are selected.
  const categoryLabel = useMemo(() => {
    if (selectedCategoryIds.length) {
      const first = categories.find((c: Category) => c.id === selectedCategoryIds[0]);
      const extra = selectedCategoryIds.length - 1;
      return `${first?.name ?? 'Kategorija'}${extra > 0 ? ` +${extra}` : ''}`;
    }
    if (appIds.length) {
      const first = apps.find((a: App) => a.id === appIds[0]);
      const extra = appIds.length - 1;
      return `${first?.name ?? 'Sritis'}${extra > 0 ? ` +${extra}` : ''}`;
    }
    return 'Sritys';
  }, [selectedCategoryIds, appIds, apps, categories]);

  const hasCategory = appIds.length > 0 || selectedCategoryIds.length > 0;

  return (
    <Page>
      <Controls>
        <SearchPill>
          {/* Emptying the field also drops the resolved point and remounts the
              map back to its default view — the nearby chip used to own that
              reset, and it isn't in the design. */}
          <AddressAutocomplete
            value={address}
            onChange={(text) => {
              setAddress(text);
              if (!text.trim() && selected) clearSelection();
            }}
            onSelect={setSelected}
          />
        </SearchPill>
        <CategoryPill type="button" onClick={() => setFilterOpen(true)} $active={hasCategory}>
          <PillLabel>{categoryLabel}</PillLabel>
          <Icon name={IconName.dropdownArrow} />
        </CategoryPill>
        <PeriodWrap>
          <PeriodDropdown
            options={PERIOD_OPTIONS}
            value={periodKey}
            selectedDates={customRange}
            onChange={(o) => {
              setPeriodKey(o.key);
              setCustomRange(o.key === TimeRanges.CUSTOM ? o.query : undefined);
            }}
          />
        </PeriodWrap>
      </Controls>

      <MapWrap>
        <MapView key={mapKey} geom={geom} filters={filters} height="100%" hideFullscreen />
      </MapWrap>

      {/* Bottom controls (Figma): register CTA left, list-view toggle right. On
          mobile they stack and center. */}
      <BottomBar>
        {!loggedIn && (
          <RegisterCta onClick={() => openAuthModal('register')}>
            Dar neturite paskyros? Užsiregistruokite
          </RegisterCta>
        )}
        <ListToggle onClick={goToList}>
          <Icon name={IconName.list} />
          Rodyti įvykių sąrašą
        </ListToggle>
        {!loggedIn && registerCardOpen && (
          <RegisterCard>
            <RegisterClose type="button" aria-label="Uždaryti" onClick={dismissRegisterCard}>
              <Icon name={IconName.close} />
            </RegisterClose>
            <RegisterText>
              <RegisterTitle>Dar neturite paskyros?</RegisterTitle>
              <div>Užsiregistruokite ir tapkite Smalsuoliu.</div>
            </RegisterText>
            <RegisterButton onClick={() => openAuthModal('register')}>Registruotis</RegisterButton>
          </RegisterCard>
        )}
      </BottomBar>

      <SritysFilterModal
        visible={filterOpen}
        value={srities}
        onChange={setSrities}
        onApply={() => setFilterOpen(false)}
        onClose={() => setFilterOpen(false)}
      />
    </Page>
  );
};

export default MapPage;

// The design runs the map edge to edge and all the way down to the fold — it
// fills everything the 80px navbar leaves. The footer sits below it; the page's
// own scrollbar reaches it, since the iframe swallows wheel events.
const Page = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 80px);
  min-height: 480px;
`;

// Bottom controls over the map: register CTA (left) + list-view toggle (right).
// On mobile they stack and center (per the mobile Figma frame).
//
// The right inset clears the map iframe's own zoom / locate / layer controls,
// which the embed draws hard against its right edge — they're cross-origin, so
// we move around them rather than restyling them.
const BottomBar = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  padding: 0 36px;
  bottom: 36px;
  z-index: 22;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }

  @media ${device.mobileL} {
    /* Stacked on mobile the bar spans the full width, so it clears the side
       controls by sitting below them instead. */
    /* One bottom-anchored stack: the toggle sits above the register card with
       a real gap, whatever height the card's text wraps to. */
    padding: 0 16px;
    bottom: 23px;
    gap: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

// White pill over the map, per the design — the black treatment is reserved
// for the primary "Rodyti įvykių sąrašą" action on the other side of the bar.
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
  background: #fafafa;
  color: ${({ theme }) => theme.colors.text.primary};
  ${font('base')};
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);

  &:hover {
    opacity: 0.92;
  }

  /* Replaced by RegisterCard on phones. */
  @media ${device.mobileL} {
    display: none;
  }
`;

// The phone frame's 361x164 card: heading, one line of copy, a full-width
// register button, and a close control in the corner.
const RegisterCard = styled.div`
  display: none;

  @media ${device.mobileL} {
    position: relative;
    align-self: center;
    /* 361 wide — the phone frame's number, kept when the viewport is wider. */
    width: 100%;
    max-width: 361px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.white};
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
    ${font('base')};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  /* Narrower than the phone frame the copy wraps to a third line, so trade
     padding for map rather than growing the card. */
  @media (max-width: 360px) {
    gap: 12px;
    padding: 16px;
  }
`;

const RegisterClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  padding: 0;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    font-size: 2.4rem;
  }
`;

const RegisterText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RegisterTitle = styled.div`
  ${font('base', 700)};
`;

const RegisterButton = styled.button`
  height: 40px;
  padding: 8px 24px;
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base')};
  cursor: pointer;
`;

const ListToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-left: auto;
  min-width: 186px;
  height: 40px;
  padding: 8px 24px;
  white-space: nowrap;
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base')};
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);

  &:hover {
    opacity: 0.92;
  }

  svg {
    font-size: 1.8rem;
  }

  @media ${device.mobileL} {
    width: 100%;
    max-width: 321px;
    min-width: 0;
    margin: 0 auto;
  }
`;

const MapWrap = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;

  iframe {
    width: 100% !important;
    height: 100% !important;
    display: block;
  }
`;

// Three floating controls across the top of the map. Each is its own rounded
// pill (matching the design), not one unified bar.
// Floating over the map, but aligned to the same 1216px content column the nav
// and the rest of the site use, rather than the viewport edges.
const Controls = styled.div`
  position: absolute;
  top: 32px;
  left: 0;
  right: 0;
  padding: 0 36px 0 42px;
  z-index: 20;
  display: flex;
  align-items: flex-start;
  gap: 16px;

  /* The phone frame stacks the address field over a two-column row of the two
     dropdowns, so they stay readable at 174px each. */
  @media ${device.mobileL} {
    flex-wrap: wrap;
    top: 9px;
    padding: 0 16px;
    gap: 12px;
  }
`;

const pillShadow = '0 8px 28px rgba(0, 0, 0, 0.14)';

const SearchPill = styled.div`
  /* Design widths: 418 for the address field, 300 for Sritys, 206 for the
     period — the last one pinned to the right edge. */
  width: 418px;
  min-width: 0;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 54px;
  box-shadow: ${pillShadow};

  @media ${device.mobileL} {
    width: 100%;
    box-shadow:
      inset 0 0 0 1px rgba(83, 83, 83, 0.12),
      ${pillShadow};
  }
`;

const CategoryPill = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 300px;
  height: 40px;
  padding: 8px 12px;
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: ${pillShadow};
  cursor: pointer;
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};

  svg {
    font-size: 2rem;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.text.primary};
  }

  @media ${device.mobileL} {
    width: calc(50% - 6px);
    box-shadow:
      inset 0 0 0 1px rgba(83, 83, 83, 0.12),
      ${pillShadow};
  }
`;

const PillLabel = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PeriodWrap = styled.div`
  /* Pushed to the far right of the controls row (address + category stay left). */
  margin-left: auto;
  width: 206px;
  box-shadow: ${pillShadow};
  border-radius: 54px;

  /* Floating over the map the pill has no outline in the design; the events
     page keeps the #BCBCBC one. */
  button {
    border-color: transparent;
  }

  @media ${device.mobileL} {
    margin-left: 0;
    /* Reset the desktop floor, or the two-column row cannot hold both pills. */
    min-width: 0;
    width: calc(50% - 6px);

    button {
      border-color: rgba(83, 83, 83, 0.12);
    }
  }
`;
