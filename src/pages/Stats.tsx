import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { orderBy } from 'lodash';
import { CONTENT_WIDTH, device, font } from '../styles';
import { timeRangeQuery } from '../utils';
import { appIcon } from '../utils/appIcons';
import { TimeRanges, yearQuery } from '../utils/types';
import api from '../utils/api';
import Loader from '../components/Loader';
import Datepicker from '../components/Datepicker';
import { calculatePreviousPeriod } from '../utils/functions';
import Delta from '../components/stats/Delta';
import BreakdownCard, { BreakdownRow } from '../components/stats/BreakdownCard';
import CityCard, { CityRow } from '../components/stats/CityCard';
import SourceCard from '../components/stats/SourceCard';
import SubscribeBanner from '../components/stats/SubscribeBanner';

const resolveQueryFromKey = (key: string): { $gte: string; $lt: string } => {
  if (/^\d{4}$/.test(key)) return yearQuery(Number(key));
  const q = timeRangeQuery[key as TimeRanges] ?? timeRangeQuery[TimeRanges.LAST_7_DAYS];
  return q as { $gte: string; $lt: string };
};

// Icon glyph and circle colour per source, straight from the design.
const APP_BADGE: Record<string, { icon: string; bg: string }> = {
  miskoKirtimai: { icon: appIcon.miskoKirtimai, bg: '#CEFFAF' },
  infostatyba: { icon: appIcon.infostatyba, bg: '#F9BEBF' },
  zemetvarkosPlanavimas: { icon: appIcon.zemetvarkosPlanavimas, bg: '#DACDFF' },
  izuvinimas: { icon: appIcon.izuvinimas, bg: '#9CDEFF' },
  savivaldybesZemetvarka: { icon: appIcon.savivaldybesZemetvarka, bg: '#DDDDDD' },
};

// Per-appType colors for the city breakdown dots. appType → color.
const APP_COLORS: Record<string, string> = {
  infostatyba: '#E5484D',
  miskoKirtimai: '#1F9D57',
  zemetvarkosPlanavimas: '#8A33FE',
  izuvinimas: '#1121DA',
  savivaldybesZemetvarka: '#FFB400',
};

const APP_SHORT_LABELS: Record<string, string> = {
  infostatyba: 'Statyba',
  miskoKirtimai: 'Kirtimai',
  zemetvarkosPlanavimas: 'Planavimas',
  izuvinimas: 'Žuvinimas',
  savivaldybesZemetvarka: 'Žemės pask.',
};

// Municipality names come from the registry as e.g. "Vilniaus m. sav." /
// "Kauno r. sav.". The design shows the plain city/place name, so strip the
// "m. sav." / "r. sav." / "sav." administrative suffix for display.
const prettyMunicipality = (name: string): string =>
  name.replace(/\s+(m\.|r\.)?\s*sav\.?$/i, '').trim();

// Widening ladder for the adaptive default: if the default window has no
// events (e.g. a source feed went stale), step out to the next wider range so
// the page opens with data rather than looking empty. Only applied when the
// user hasn't explicitly picked a range.
const RANGE_LADDER: TimeRanges[] = [
  TimeRanges.LAST_7_DAYS,
  TimeRanges.LAST_28_DAYS,
  TimeRanges.LAST_90_DAYS,
  TimeRanges.LAST_365_DAYS,
  TimeRanges.ALL_TIME,
];

const Stats = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialRange = searchParams.get('range') ?? TimeRanges.LAST_7_DAYS;
  const initialQuery: { $gte: string; $lt: string } =
    initialRange === TimeRanges.CUSTOM && searchParams.get('from') && searchParams.get('to')
      ? { $gte: searchParams.get('from')!, $lt: searchParams.get('to')! }
      : resolveQueryFromKey(initialRange);

  const [query, setQuery] = useState<{ $gte: string; $lt: string }>(initialQuery);
  const [dateFilter, setDateFilter] = useState<string>(initialRange);
  const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);

  const { data: lastUpdateData, isLoading: isLoadingLastUpdate } = useQuery({
    queryKey: ['lastUpdate'],
    queryFn: () => api.getLastUpdate(),
  });

  const effectiveQuery =
    dateFilter === TimeRanges.ALL_TIME && lastUpdateData?.firstGlobalEvent
      ? { ...query, $gte: lastUpdateData.firstGlobalEvent.slice(0, 16) }
      : query;

  const { data, isLoading } = useQuery({
    queryKey: ['stats', effectiveQuery],
    queryFn: () => api.getStats(effectiveQuery),
    refetchOnWindowFocus: false,
  });

  // Adaptive default range: when the user hasn't explicitly chosen a range and
  // the current window returned zero events, step out to the next wider range.
  // Runs at most once per rung and stops at ALL_TIME, so it can't loop.
  const userPickedRange = !!searchParams.get('range');
  useEffect(() => {
    if (userPickedRange || isLoading || !data) return;
    if (data.count > 0) return;
    const idx = RANGE_LADDER.indexOf(dateFilter as TimeRanges);
    if (idx === -1 || idx >= RANGE_LADDER.length - 1) return; // unknown or already widest
    const next = RANGE_LADDER[idx + 1];
    setDateFilter(next);
    setQuery(resolveQueryFromKey(next));
  }, [data, isLoading, dateFilter, userPickedRange]);

  const previousQuery = calculatePreviousPeriod(effectiveQuery);
  const { data: previousData, isFetching: isPreviousFetching } = useQuery({
    queryKey: ['stats', previousQuery],
    queryFn: () => api.getStats(previousQuery),
    enabled: isComparisonEnabled && !!previousQuery,
    refetchOnWindowFocus: false,
  });

  const byApp = data?.byApp;
  const prevByApp = previousData?.byApp;

  // ---- Top KPI strip ----------------------------------------------------
  const kpis = [
    { label: 'Įvykių', count: data?.count, previous: previousData?.count },
    {
      label: 'Statyba',
      count: byApp?.infostatyba?.count,
      previous: prevByApp?.infostatyba?.count,
    },
    {
      label: 'Kirtimai',
      count: byApp?.miskoKirtimai?.count,
      previous: prevByApp?.miskoKirtimai?.count,
    },
    {
      label: 'Žuvinimas',
      count: byApp?.izuvinimas?.count,
      previous: prevByApp?.izuvinimas?.count,
    },
    {
      label: 'Planavimas',
      count: byApp?.zemetvarkosPlanavimas?.count,
      previous: prevByApp?.zemetvarkosPlanavimas?.count,
    },
  ];

  // ---- "Suskirstymas pagal tipą" cards ---------------------------------
  // Build sorted rows from a byTag map, attaching previous counts for deltas.
  const tagRows = (
    tagMap?: Record<string, { count: number }>,
    prevMap?: Record<string, { count: number }>,
  ): BreakdownRow[] => {
    if (!tagMap) return [];
    const total = Object.values(tagMap).reduce((s, v) => s + (v.count || 0), 0);
    const rows = Object.entries(tagMap).map(([label, v]) => ({
      label,
      count: v.count || 0,
      previousCount: prevMap?.[label]?.count,
      total,
    }));
    return orderBy(rows, (r) => r.count, 'desc');
  };

  // One card per source, in the design's order. Only miskoKirtimai and
  // infostatyba currently carry tag breakdowns in the data; the rest still get a
  // card showing their real total with an empty-rows note, rather than
  // disappearing, so the page shape stays stable and a zero reads as a zero.
  const breakdownCards = [
    {
      app: 'miskoKirtimai',
      title: 'Kirtimų leidimai',
      total: byApp?.miskoKirtimai?.count || 0,
      rows: tagRows(byApp?.miskoKirtimai?.byTag, prevByApp?.miskoKirtimai?.byTag),
    },
    {
      app: 'infostatyba',
      title: 'Statybų leidimai',
      total: byApp?.infostatyba?.count || 0,
      rows: tagRows(byApp?.infostatyba?.byTag, prevByApp?.infostatyba?.byTag),
    },
    {
      app: 'zemetvarkosPlanavimas',
      title: 'Žemėtvarkos planavimas',
      total: byApp?.zemetvarkosPlanavimas?.count || 0,
      rows: tagRows(byApp?.zemetvarkosPlanavimas?.byTag, prevByApp?.zemetvarkosPlanavimas?.byTag),
    },
    {
      app: 'izuvinimas',
      title: 'Žuvinimas',
      total: byApp?.izuvinimas?.count || 0,
      rows: tagRows(byApp?.izuvinimas?.byTag, prevByApp?.izuvinimas?.byTag),
    },
    {
      app: 'savivaldybesZemetvarka',
      title: 'Žemės paskirties keitimai',
      total: byApp?.savivaldybesZemetvarka?.count || 0,
      rows: tagRows(byApp?.savivaldybesZemetvarka?.byTag, prevByApp?.savivaldybesZemetvarka?.byTag),
    },
  ];

  // ---- "Akyviausi miestai" ---------------------------------------------
  const byMunicipality = data?.byMunicipality || {};
  const prevByMunicipality = previousData?.byMunicipality || {};

  const topCities = orderBy(
    Object.entries(byMunicipality).map(([name, v]) => ({ name, ...v })),
    (c) => c.count,
    'desc',
  ).slice(0, 3);

  const cityRows = (cityName: string, byAppMap: Record<string, number>): CityRow[] => {
    const cityTotal = Object.values(byAppMap).reduce((s, n) => s + n, 0);
    const prevCity = prevByMunicipality[cityName]?.byApp || {};
    return orderBy(
      Object.entries(byAppMap).map(([appType, count]) => ({
        label: APP_SHORT_LABELS[appType] || appType,
        color: APP_COLORS[appType] || '#707070',
        count,
        previousCount: prevCity[appType],
        total: cityTotal,
      })),
      (r) => r.count,
      'desc',
    );
  };

  // ---- "Duomenų šaltiniai" ----------------------------------------------
  const getUpd = (appType: string) => lastUpdateData?.byAppType?.find((i) => i.appType === appType);

  const sourceItems = [
    { label: 'Miško kirtimai', app: 'miskoKirtimai' },
    { label: 'Žuvų įveisimas', app: 'izuvinimas' },
    { label: 'Statybos leidimai', app: 'infostatyba' },
    { label: 'Žemėtvarkos planavimas', app: 'zemetvarkosPlanavimas' },
    { label: 'Žemės paskirties keitimas (Vilnius)', app: 'savivaldybesZemetvarka' },
  ].map((s) => ({ ...s, upd: getUpd(s.app) }));

  return (
    <Page>
      <Header>
        <PageTitle>Statistika</PageTitle>
        <Controls>
          <ToggleContainer onClick={() => setIsComparisonEnabled((v) => !v)}>
            <ToggleLabel>Lyginti su ankstesniu periodu</ToggleLabel>
            <ToggleSwitch $isActive={isComparisonEnabled}>
              <ToggleCircle $isActive={isComparisonEnabled} />
            </ToggleSwitch>
          </ToggleContainer>
          <Datepicker
            onChange={(filterValue, date) => {
              setDateFilter(filterValue);
              setQuery(date);
              if (filterValue === TimeRanges.CUSTOM) {
                setSearchParams({ range: filterValue, from: date.$gte, to: date.$lt });
              } else {
                setSearchParams({ range: filterValue });
              }
            }}
            value={dateFilter}
            selectedDates={query}
          />
        </Controls>
      </Header>

      {isLoading ? (
        <LoaderContainer>
          <Loader />
        </LoaderContainer>
      ) : (
        <>
          <KpiStrip>
            {kpis.map((k) => (
              <Kpi key={k.label}>
                <KpiLabel>{k.label}</KpiLabel>
                <KpiValueRow>
                  <KpiValue>{(k.count ?? 0).toLocaleString('lt-LT')}</KpiValue>
                </KpiValueRow>
                {isComparisonEnabled && (
                  <Delta current={k.count} previous={k.previous} isFetching={isPreviousFetching} />
                )}
              </Kpi>
            ))}
          </KpiStrip>

          <Rule />

          <SectionTitle>Suskirstymas pagal tipą</SectionTitle>
          <CardGrid>
            {breakdownCards.map((c) => (
              <BreakdownCard
                key={c.title}
                icon={APP_BADGE[c.app].icon}
                iconBg={APP_BADGE[c.app].bg}
                title={c.title}
                total={c.total}
                rows={c.rows}
                showComparison={isComparisonEnabled}
                isFetching={isPreviousFetching}
              />
            ))}
          </CardGrid>

          <Rule />

          {/* Section always renders so the page keeps a stable shape across
              periods; short windows just have fewer (or no) municipalities. */}
          <SectionTitle>Akyviausi miestai</SectionTitle>
          {topCities.length > 0 ? (
            <CityGrid>
              {topCities.map((city) => (
                <CityCard
                  key={city.name}
                  city={prettyMunicipality(city.name)}
                  rows={cityRows(city.name, city.byApp)}
                  showComparison={isComparisonEnabled}
                  isFetching={isPreviousFetching}
                />
              ))}
            </CityGrid>
          ) : (
            <EmptyNote>Šiuo laikotarpiu įvykių nėra</EmptyNote>
          )}

          {!isLoadingLastUpdate && lastUpdateData && (
            <>
              <Rule />

              <SectionTitle>Duomenų šaltiniai</SectionTitle>
              <SourceGrid>
                {sourceItems.map((s) => (
                  <SourceCard
                    key={s.label}
                    icon={APP_BADGE[s.app].icon}
                    iconBg={APP_BADGE[s.app].bg}
                    title={s.label}
                    lastUpdate={s.upd?.lastUpdate || null}
                    lastUpdateCount={s.upd?.lastUpdateCount || 0}
                  />
                ))}
              </SourceGrid>
            </>
          )}

          <SubscribeBanner />
        </>
      )}
    </Page>
  );
};

export default Stats;

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
  margin-bottom: 48px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    margin-bottom: 32px;
  }
`;

// The design separates every block on this page with a hairline, 48px clear on
// both sides.
const Rule = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.grey[300]};
  margin: 48px 0;

  @media ${device.mobileL} {
    margin: 32px 0;
  }
`;

const PageTitle = styled.h1`
  ${font('3xl')};
  margin: 0;
`;

// On mobile the period picker and the comparison toggle stack full-width under
// the title, matching the frame, instead of wrapping at their natural widths.
const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 36px;
  flex-wrap: wrap;

  @media ${device.mobileL} {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

// Design: five 230px tiles spread across the content width, not five equal
// fractions of it.
const KpiStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 230px);
  justify-content: space-between;

  /* Five 230px tiles need ~1214px; narrower than that they must share the row
     instead of running past its right edge. */
  @media ${device.tablet} {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 24px;
  }

  /* Two per row on mobile (2/2/2 rather than the design's 3+2) — five tiles
     leave the last one alone on its row, which is intended. */
  @media ${device.mobileL} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 16px;
  }
`;

const Kpi = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const KpiLabel = styled.div`
  ${font('lg')};
  color: ${({ theme }) => theme.colors.grey[650]};
`;

const KpiValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const KpiValue = styled.div`
  font-size: 3.6rem;
  line-height: 4.7rem;
  font-weight: 400;
  letter-spacing: -0.05em;
  color: ${({ theme }) => theme.colors.text?.primary};
`;

const SectionTitle = styled.h2`
  ${font('xl', 500)};
  margin: 0 0 24px;
`;

const CardGrid = styled.div`
  display: grid;
  /* minmax(0,1fr): grid items default to min-width:auto, so a long label
     would push the track past the viewport instead of ellipsizing. */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  /* Cards size to their content instead of stretching to the tallest in the
     row — an empty card was rendering as a tall box with one line in it. */
  align-items: start;
  gap: 24px;
  @media ${device.tablet} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media ${device.mobileL} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const EmptyNote = styled.div`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  padding: 8px 0 24px;
`;

const CityGrid = styled.div`
  display: grid;
  /* minmax(0,1fr): grid items default to min-width:auto, so a long label
     would push the track past the viewport instead of ellipsizing. */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  /* Matches the other card grids: 2-up on tablet, single column only on
     phones. It previously dropped straight to one column at 1280px, which
     left three very wide stacked cards on mid-size screens. */
  @media ${device.tablet} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media ${device.mobileL} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const SourceGrid = styled.div`
  display: grid;
  /* minmax(0,1fr): grid items default to min-width:auto, so a long label
     would push the track past the viewport instead of ellipsizing. */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  @media ${device.mobileL} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  width: 100%;
  margin-top: 48px;
  justify-content: center;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const ToggleLabel = styled.span`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text?.primary};
`;

const ToggleSwitch = styled.div<{ $isActive: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 100px;
  flex-shrink: 0;
  background-color: ${({ $isActive, theme }) => ($isActive ? '#1FC84C' : theme.colors.grey[400])};
  position: relative;
  transition: background-color 0.3s ease;
`;

const ToggleCircle = styled.div<{ $isActive: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.white};
  position: absolute;
  top: 2px;
  left: ${({ $isActive }) => ($isActive ? '22px' : '2px')};
  transition: left 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;
