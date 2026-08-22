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
  // The phone frame replaces the register pill with a dismissible card over the
  // map; dismissing it leaves the map unobstructed.
  const [registerCardOpen, setRegisterCardOpen] = useState(true);
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
            onChange={(o) => setPeriodKey(o.key)}
          />
        </PeriodWrap>
      </Controls>

      <MapWrap>
        <MapView key={mapKey} geom={geom} filters={filters} height="100%" hideFullscreen />
      </MapWrap>

      {/* Bottom controls (Figma): register CTA left, list-view toggle right. On
          mobile they stack and center. */}
      {!loggedIn && registerCardOpen && (
        <RegisterCard>
          <RegisterClose
            type="button"
            aria-label="Uždaryti"
            onClick={() => setRegisterCardOpen(false)}
          >
            <Icon name={IconName.close} />
          </RegisterClose>
          <RegisterText>
            <RegisterTitle>Dar neturite paskyros?</RegisterTitle>
            <div>Užsiregistruokite ir tapkite Smalsuoliu.</div>
          </RegisterText>
          <RegisterButton onClick={() => openAuthModal('register')}>Registruotis</RegisterButton>
        </RegisterCard>
      )}

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
    padding: 0 20px;
    bottom: 12px;
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
    position: absolute;
    z-index: 22;
    left: 16px;
    right: 16px;
    bottom: 76px;
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
    width: 321px;
    margin: 0 auto;
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
  min-width: 206px;
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
