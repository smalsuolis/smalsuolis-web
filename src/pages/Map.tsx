import { useContext, useEffect, useMemo, useState } from 'react';
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

// The radius (metres) of the circle drawn around a searched address — matches
// the /events/near lookup, so the map view and the popup count agree.
const SEARCH_RADIUS_M = 2000;

// Matches the nav / footer content column, so the floating map controls line up
// with the rest of the site instead of hugging the viewport edges.
const CONTENT_MAX_WIDTH = '1216px';

// The smalsuolis map iframe draws incoming geometry with dataProjection EPSG:3346
// (LKS94) — hardcoded in its route. Address suggestions come in EPSG:4326
// (lng/lat), so we must convert to 3346 before sending, or the point lands far
// off-map and the view goes grey. Register the LKS94 definition for proj4.
proj4.defs(
  'EPSG:3346',
  '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9998 +x_0=500000 +y_0=0 ' +
    '+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);

// Build a circle (as a Polygon) of `radiusM` around a lng/lat point, with all
// coordinates already in EPSG:3346 so the iframe draws + zooms correctly. In
// 3346 (metres) the circle is a simple metric offset from the projected centre.
const circleFeatureCollection3346 = (
  geometry: AddressSuggestion['geometry'],
  radiusM = SEARCH_RADIUS_M,
  steps = 64,
) => {
  const [lng, lat] = geometry.coordinates;
  const [cx, cy] = proj4('EPSG:4326', 'EPSG:3346', [lng, lat]);
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([cx + radiusM * Math.cos(a), cy + radiusM * Math.sin(a)]);
  }
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [cx, cy] }, properties: {} },
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [ring] },
        properties: {},
      },
    ],
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

  const [address, setAddress] = useState(navState?.address ?? searchParams.get('address') ?? '');
  const [selected, setSelected] = useState<AddressSuggestion | null>(navState?.suggestion ?? null);
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
        : []);
    return { appIds, categoriesByApp: {} };
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [periodKey, setPeriodKey] = useState<string>(
    searchParams.get('range') ?? TimeRanges.LAST_28_DAYS,
  );

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

  // On reload with ?address= but no resolved point, re-run suggest once.
  useEffect(() => {
    const urlAddress = searchParams.get('address');
    if (!selected && urlAddress && urlAddress.trim().length >= 3) {
      api
        .suggestAddresses(urlAddress)
        .then((results) => {
          if (results[0]) setSelected(results[0]);
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync with the current selection/filters.
  useEffect(() => {
    const next: Record<string, string> = {};
    if (address) next.address = address;
    if (appIds.length) next.app = appIds.join(',');
    if (periodKey) next.range = periodKey;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, appIds, periodKey]);

  // Switch to the list view, carrying the current filters. The events page uses
  // different param names than the map (?apps= vs ?app=), and reads them via
  // its own URL-init effect, so translate here.
  const goToList = () => {
    const params = new URLSearchParams({ view: 'list' });
    if (appIds.length) params.set('apps', appIds.join(','));
    if (selectedCategoryIds.length) params.set('categories', selectedCategoryIds.join(','));
    if (periodKey) params.set('range', periodKey);
    navigate(`${slugs.events}?${params.toString()}`);
  };

  // Count of events within SEARCH_RADIUS_M of the selected address, for the
  // sleek nearby chip. Only the count is needed here (per-pin detail comes from
  // the map iframe's own click popups).
  const { data: nearbyData } = useQuery({
    queryKey: ['events-near', selected?.geometry.coordinates],
    queryFn: () =>
      api.getEventsNear({
        lng: selected!.geometry.coordinates[0],
        lat: selected!.geometry.coordinates[1],
        radius: SEARCH_RADIUS_M,
        limit: 1,
      }),
    enabled: !!selected,
  });
  const nearbyCount = selected ? nearbyData?.count : undefined;

  // When an address is selected, draw a 3346 circle around it (correct location
  // + a sensible zoom). When nothing is selected, geom is undefined so we don't
  // post it (deselect handling that resets the view lives in MapView).
  const geom = useMemo(
    () => (selected ? circleFeatureCollection3346(selected.geometry) : undefined),
    [selected],
  );

  const period = PERIOD_OPTIONS.find((p) => p.key === periodKey);

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
          <AddressAutocomplete value={address} onChange={setAddress} onSelect={setSelected} />
        </SearchPill>
        <CategoryPill type="button" onClick={() => setFilterOpen(true)} $active={hasCategory}>
          <PillLabel>{categoryLabel}</PillLabel>
          <Icon name={IconName.dropdownArrow} />
        </CategoryPill>
        <PeriodWrap>
          <PeriodDropdown
            options={PERIOD_OPTIONS}
            value={periodKey}
            onChange={(o) => setPeriodKey(o.key)}
          />
        </PeriodWrap>
      </Controls>

      <MapWrap>
        <MapView key={mapKey} geom={geom} filters={filters} height="100%" hideFullscreen />
      </MapWrap>

      {/* Sleek nearby-count chip instead of a big floating card: the map iframe
          already shows per-pin detail popups on click, so here we only surface
          the "N events within the radius" summary for the searched address. */}
      {selected && (
        <NearbyChip>
          <NearbyCount>
            {nearbyCount === undefined ? '…' : nearbyCount.toLocaleString('lt-LT')}
          </NearbyCount>
          <NearbyLabel>įvykių {Math.round(SEARCH_RADIUS_M / 1000)} km spinduliu</NearbyLabel>
          <ChipClose onClick={clearSelection} aria-label="Išvalyti">
            <Icon name={IconName.close} />
          </ChipClose>
        </NearbyChip>
      )}

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

// The map takes most of the viewport but stops short of the bottom, so the page
// scrolls smoothly on past it to the footer (the iframe swallows wheel events,
// so a full-height map would trap the scroll). The bottom corners are rounded
// and the band sits a touch inset for a sleek edge.
const Page = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 72px - 56px);
  min-height: 480px;
  margin-bottom: 24px;

  @media ${device.mobileL} {
    height: calc(100vh - 64px - 48px);
  }
`;

// Sleek nearby-count chip: a compact white pill top-ish over the map (below the
// controls), not a big card. Shows the count for the searched address.
// Aligned to the content column's left edge (see Controls), not the viewport.
const NearbyChip = styled.div`
  position: absolute;
  left: max(32px, calc((100% - ${CONTENT_MAX_WIDTH}) / 2 + 32px));
  top: 84px;
  z-index: 22;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 10px 16px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 100px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);

  @media ${device.mobileL} {
    left: 12px;
    right: 12px;
    top: auto;
    bottom: 108px;
    justify-content: center;
  }
`;

const NearbyCount = styled.span`
  ${font('lg', 700)};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const NearbyLabel = styled.span`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const ChipClose = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.grey[500]};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background};
  }

  svg {
    font-size: 1.4rem;
  }
`;

// Bottom controls over the map: register CTA (left) + list-view toggle (right).
// On mobile they stack and center (per the mobile Figma frame).
//
// The right inset clears the map iframe's own zoom / locate / layer controls,
// which the embed draws hard against its right edge — they're cross-origin, so
// we move around them rather than restyling them.
const BottomBar = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: ${CONTENT_MAX_WIDTH};
  /* Right padding clears the map iframe's own zoom / locate controls, which the
     embed draws hard against its right edge. */
  padding: 0 72px 0 32px;
  bottom: 24px;
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
    padding: 0 20px;
    bottom: 12px;
    flex-direction: column;
    align-items: stretch;
  }
`;

const RegisterCta = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 14px 24px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base', 500)};
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);

  &:hover {
    opacity: 0.92;
  }

  @media ${device.mobileL} {
    order: 2;
    justify-content: center;
  }
`;

const ListToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 14px 24px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base', 600)};
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);

  &:hover {
    opacity: 0.92;
  }

  svg {
    font-size: 1.8rem;
  }

  @media ${device.mobileL} {
    order: 1;
    margin-left: 0;
    justify-content: center;
  }
`;

const MapWrap = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 0 0 24px 24px;
  overflow: hidden;

  iframe {
    width: 100% !important;
    height: 100% !important;
    display: block;
  }

  @media ${device.mobileL} {
    border-radius: 0 0 16px 16px;
  }
`;

// Three floating controls across the top of the map. Each is its own rounded
// pill (matching the design), not one unified bar.
// Floating over the map, but aligned to the same 1216px content column the nav
// and the rest of the site use, rather than the viewport edges.
const Controls = styled.div`
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: ${CONTENT_MAX_WIDTH};
  padding: 0 32px;
  z-index: 20;
  display: flex;
  align-items: flex-start;
  gap: 16px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
    top: 12px;
    padding: 0 20px;
    gap: 12px;
  }
`;

const pillShadow = '0 8px 28px rgba(0, 0, 0, 0.14)';


const SearchPill = styled.div`
  /* Fixed-ish width on the left; the period pill is pushed to the far right via
     its own margin-left:auto, keeping address + category grouped left. */
  width: 380px;
  max-width: 100%;
  min-width: 0;
  min-height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 44px;
  box-shadow: ${pillShadow};

  @media ${device.mobileL} {
    width: 100%;
  }
`;

const CategoryPill = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 240px;
  min-height: 56px;
  padding: 12px 20px;
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: ${pillShadow};
  cursor: pointer;
  ${font('lg')};
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.grey[600])};

  svg {
    font-size: 1.6rem;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.grey[600]};
  }

  @media ${device.mobileL} {
    min-width: 0;
    width: 100%;
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
  min-width: 200px;
  box-shadow: ${pillShadow};
  border-radius: 44px;

  @media ${device.mobileL} {
    margin-left: 0;
    min-width: 0;
    width: 100%;
  }
`;
