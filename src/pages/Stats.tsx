import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import Icon from '../components/Icons';
import { device } from '../styles';
import { Frequency, IconName, timeRangeQuery } from '../utils';
import { TimeRanges, yearQuery } from '../utils/types';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import Loader from '../components/Loader';
import Datepicker from '../components/Datepicker';
import { orderBy } from 'lodash';
import {
  formatRelativeTime,
  getUpdateStatusColor,
  calculatePreviousPeriod,
} from '../utils/functions';
import Tooltip from '../components/Tooltip';

const StatDelta = ({
  current,
  previous = 0,
  isFetching,
}: {
  current?: number;
  previous?: number;
  isFetching?: boolean;
}) => {
  if (isFetching) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        <MiniSpinner />
      </span>
    );
  }

  if (current === undefined) return null;
  const diff = current - previous;
  // Fix floating point errors by rounding to 2 decimal places if it has fractional parts
  const formattedDiff = diff % 1 !== 0 ? parseFloat(diff.toFixed(2)) : diff;
  if (formattedDiff === 0) return null;

  const isPositive = formattedDiff > 0;
  const color = isPositive ? '#10B981' : '#EF4444';
  const sign = isPositive ? '+' : '';

  return (
    <span style={{ color, fontSize: '1.4rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {sign}
      {formattedDiff}
    </span>
  );
};

const bannerUrl = '/stats_banner.png';

const resolveQueryFromKey = (key: string): { $gte: string; $lt: string } => {
  if (/^\d{4}$/.test(key)) return yearQuery(Number(key));
  const q = timeRangeQuery[key as TimeRanges] ?? timeRangeQuery[TimeRanges.LAST_7_DAYS];
  return q as { $gte: string; $lt: string };
};

const Stats = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deforestationStatsFilter, setDeforestationStatsFilter] = useState('count');
  const [showAllDeforestationStats, setShowAllDeforestationStats] = useState(false);

  const initialRange = searchParams.get('range') ?? TimeRanges.LAST_7_DAYS;
  const initialQuery: { $gte: string; $lt: string } =
    initialRange === TimeRanges.CUSTOM && searchParams.get('from') && searchParams.get('to')
      ? { $gte: searchParams.get('from')!, $lt: searchParams.get('to')! }
      : resolveQueryFromKey(initialRange);

  const [query, setQuery] = useState<{ $gte: string; $lt: string }>(initialQuery);
  const [dateFilter, setDateFilter] = useState<string>(initialRange);
  const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['stats', query],
    queryFn: () => api.getStats(query),
    refetchOnWindowFocus: false,
  });

  const previousQuery = calculatePreviousPeriod(query);
  const { data: previousData, isFetching: isPreviousFetching } = useQuery({
    queryKey: ['stats', previousQuery],
    queryFn: () => api.getStats(previousQuery),
    enabled: isComparisonEnabled && !!previousQuery,
    refetchOnWindowFocus: false,
  });

  const { data: lastUpdateData, isLoading: isLoadingLastUpdate } = useQuery({
    queryKey: ['lastUpdate'],
    queryFn: () => api.getLastUpdate(),
  });

  const mainStatsData = [
    {
      label: 'Įvykių',
      count: data?.count,
      previousCount: previousData?.count,
      icon: IconName.heart,
    },
    {
      label: 'Kirtimų leidimų',
      count: data?.byApp?.miskoKirtimai?.count,
      previousCount: previousData?.byApp?.miskoKirtimai?.count,
      icon: IconName.forest,
    },
    {
      label: 'Žuvinimų',
      count: data?.byApp?.izuvinimas?.count,
      previousCount: previousData?.byApp?.izuvinimas?.count,
      icon: IconName.fishThin,
    },
    {
      label: 'Statybos leidimų',
      count: data?.byApp?.infostatyba?.count,
      previousCount: previousData?.byApp?.infostatyba?.count,
      icon: IconName.house,
    },
    {
      label: 'Žemėtvarkos planavimų',
      count: data?.byApp?.zemetvarkosPlanavimas?.count,
      previousCount: previousData?.byApp?.zemetvarkosPlanavimas?.count,
      icon: IconName.map,
    },
  ];

  const constructionsStatsByTag = data?.byApp?.infostatyba?.byTag;
  const deforestationStatsByTag = data?.byApp?.miskoKirtimai?.byTag;

  const constructionsStatsArray =
    constructionsStatsByTag &&
    Object.keys(constructionsStatsByTag).reduce(
      (acc: Array<{ label: string; count: number; previousCount?: number }>, key) => {
        acc.push({
          label: key,
          count: constructionsStatsByTag[key].count,
          previousCount: previousData?.byApp?.infostatyba?.byTag?.[key]?.count,
        });
        return acc;
      },
      [],
    );

  const sortedConstructionsStatsArray = orderBy(
    constructionsStatsArray,
    (item) => Number(item.count),
    'desc',
  );

  const highestConstructionsStatsNumber = constructionsStatsByTag
    ? Object.keys(constructionsStatsByTag).reduce((acc, key) => {
        return acc < constructionsStatsByTag[key].count ? constructionsStatsByTag[key].count : acc;
      }, 0)
    : 1;

  const deforestationStatsArray =
    deforestationStatsByTag &&
    Object.keys(deforestationStatsByTag).reduce(
      (
        acc: Array<{
          label: string;
          count: number;
          previousCount?: number;
          area: number;
          previousArea?: number;
          calculatedArea: number;
          previousCalculatedArea?: number;
        }>,
        key,
      ) => {
        const calculatedArea = (deforestationStatsByTag[key] as any).calculatedArea || 0;
        const previousCalculatedArea =
          (previousData?.byApp?.miskoKirtimai?.byTag?.[key] as any)?.calculatedArea || 0;
        acc.push({
          label: key,
          count: deforestationStatsByTag[key].count || 0,
          previousCount: previousData?.byApp?.miskoKirtimai?.byTag?.[key]?.count,
          area: deforestationStatsByTag[key].area || 0,
          previousArea: previousData?.byApp?.miskoKirtimai?.byTag?.[key]?.area,
          calculatedArea,
          previousCalculatedArea,
        });
        return acc;
      },
      [],
    );

  const sortedDeforestationStatsArray = orderBy(
    deforestationStatsArray,
    (item) => Number(item[deforestationStatsFilter as keyof typeof item] || 0),
    'desc',
  );

  if (sortedDeforestationStatsArray && sortedDeforestationStatsArray.length > 0) {
    const totalCount = sortedDeforestationStatsArray.reduce(
      (acc, item) => acc + Number(item.count || 0),
      0,
    );
    const totalPreviousCount = sortedDeforestationStatsArray.reduce(
      (acc, item) => acc + Number(item.previousCount || 0),
      0,
    );
    const totalArea = sortedDeforestationStatsArray.reduce(
      (acc, item) => acc + Number(item.area || 0),
      0,
    );
    const totalPreviousArea = sortedDeforestationStatsArray.reduce(
      (acc, item) => acc + Number(item.previousArea || 0),
      0,
    );
    const totalCalculatedArea = sortedDeforestationStatsArray.reduce(
      (acc, item) => acc + Number(item.calculatedArea || 0),
      0,
    );
    const totalPreviousCalculatedArea = sortedDeforestationStatsArray.reduce(
      (acc, item) => acc + Number(item.previousCalculatedArea || 0),
      0,
    );

    sortedDeforestationStatsArray.unshift({
      label:
        deforestationStatsFilter === 'count'
          ? 'Bendras leidimų skaičius'
          : 'Bendras kertamas plotas',
      count: totalCount,
      previousCount: totalPreviousCount,
      area: totalArea,
      previousArea: totalPreviousArea,
      calculatedArea: totalCalculatedArea,
      previousCalculatedArea: totalPreviousCalculatedArea,
    });
  }

  const highestDeforestationStatsNumber = deforestationStatsByTag
    ? Object.keys(deforestationStatsByTag).reduce((acc, key) => {
        const amount = deforestationStatsByTag[key][deforestationStatsFilter];
        return acc < amount ? amount : acc;
      }, 0)
    : 1;

  // Get last update data for each app type
  const getLastUpdateForAppType = (appType: string) => {
    return lastUpdateData?.byAppType?.find((item) => item.appType === appType);
  };

  const miskoKirtimaiUpdate = getLastUpdateForAppType('miskoKirtimai');
  const izuvinimasUpdate = getLastUpdateForAppType('izuvinimas');
  const infostatybaUpdate = getLastUpdateForAppType('infostatyba');
  const zemetvarkosPlanavimasUpdate = getLastUpdateForAppType('zemetvarkosPlanavimas');

  const lastUpdateItems = [
    {
      label: 'Miško kirtimai',
      lastUpdate: miskoKirtimaiUpdate?.lastUpdate || null,
      lastUpdateCount: miskoKirtimaiUpdate?.lastUpdateCount || 0,
      icon: IconName.forest,
    },
    {
      label: 'Žuvų įveisimas',
      lastUpdate: izuvinimasUpdate?.lastUpdate || null,
      lastUpdateCount: izuvinimasUpdate?.lastUpdateCount || 0,
      icon: IconName.fishThin,
    },
    {
      label: 'Statybos leidimai',
      lastUpdate: infostatybaUpdate?.lastUpdate || null,
      lastUpdateCount: infostatybaUpdate?.lastUpdateCount || 0,
      icon: IconName.house,
    },
    {
      label: 'Žemėtvarkos planavimas',
      lastUpdate: zemetvarkosPlanavimasUpdate?.lastUpdate || null,
      lastUpdateCount: zemetvarkosPlanavimasUpdate?.lastUpdateCount || 0,
      icon: IconName.map,
    },
  ];

  return (
    <MainContainer>
      <BannerImageContainer>
        <Image src={bannerUrl} />
      </BannerImageContainer>
      {isLoading ? (
        <LoaderContainer>
          <Loader />
        </LoaderContainer>
      ) : (
        <Content>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
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
            <DateRangeLabel>
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const start =
                  dateFilter === TimeRanges.ALL_TIME && lastUpdateData?.firstGlobalEvent
                    ? lastUpdateData.firstGlobalEvent.slice(0, 10)
                    : query.$gte.slice(0, 10);
                const end = query.$lt.slice(0, 10) > today ? today : query.$lt.slice(0, 10);
                return `${start} – ${end}`;
              })()}
            </DateRangeLabel>
            <ToggleContainer onClick={() => setIsComparisonEnabled(!isComparisonEnabled)}>
              <ToggleLabel>Lyginti su ankstesniu periodu</ToggleLabel>
              <ToggleSwitch $isActive={isComparisonEnabled}>
                <ToggleCircle $isActive={isComparisonEnabled} />
              </ToggleSwitch>
            </ToggleContainer>
          </div>

          <Row>
            <MainStatsWrapper>
              {mainStatsData.map((item) => (
                <MainStatsItem key={item.label}>
                  <IconWrapper>
                    <StyledIcon name={item.icon} />
                  </IconWrapper>
                  <StatsInfoContainer>
                    <StatsNumber style={{ gap: '4px' }}>
                      <span style={{ whiteSpace: 'nowrap' }}>{item.count || '0'}</span>
                      {isComparisonEnabled && (
                        <StatDelta
                          current={item.count}
                          previous={item.previousCount}
                          isFetching={isPreviousFetching}
                        />
                      )}
                    </StatsNumber>
                    <StatsLabel>{item.label}</StatsLabel>
                  </StatsInfoContainer>
                </MainStatsItem>
              ))}
            </MainStatsWrapper>
            <DetailedStatsWrapper>
              <StatsHeader>Statybų leidimai</StatsHeader>

              {constructionsStatsByTag ? (
                sortedConstructionsStatsArray?.map(({ label, count, previousCount }) => {
                  const statsPercentage = (count * 100) / highestConstructionsStatsNumber;
                  return (
                    <>
                      <DetailedStatsRow
                        key={label}
                        style={{
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <InfoLabel style={{ flex: 1, paddingRight: 0, minWidth: '200px' }}>
                          {label}
                        </InfoLabel>
                        <AmountLabel
                          style={{
                            flexShrink: 0,
                            minWidth: 'auto',
                            gap: '4px',
                            marginLeft: 'auto',
                          }}
                        >
                          <span style={{ whiteSpace: 'nowrap' }}>{count}</span>
                          {isComparisonEnabled && (
                            <StatDelta
                              current={count}
                              previous={previousCount}
                              isFetching={isPreviousFetching}
                            />
                          )}
                        </AmountLabel>
                      </DetailedStatsRow>
                      <InfoBarWrapper>
                        <InfoBar $percentage={statsPercentage} />
                      </InfoBarWrapper>
                    </>
                  );
                })
              ) : (
                <InfoLabel>Nėra duomenų</InfoLabel>
              )}
            </DetailedStatsWrapper>

            <DetailedStatsWrapper>
              <RowContainer>
                <StatsHeader>Kirtimų leidimai</StatsHeader>
                {deforestationStatsByTag && (
                  <SliderWrapper>
                    <SliderButton
                      onClick={() => setDeforestationStatsFilter('count')}
                      $isActive={deforestationStatsFilter === 'count'}
                    >
                      <SwitchLabel>Leidimų skaičius</SwitchLabel>
                    </SliderButton>
                    <SliderButton
                      onClick={() => setDeforestationStatsFilter('area')}
                      $isActive={deforestationStatsFilter === 'area'}
                    >
                      <SwitchLabel>Kertamas plotas</SwitchLabel>
                    </SliderButton>
                  </SliderWrapper>
                )}
              </RowContainer>
              {deforestationStatsByTag ? (
                <>
                  {sortedDeforestationStatsArray
                    ?.slice(0, 1)
                    .map(({ label, count, area, previousCount, previousArea }) => {
                      const safeArea = area || 0;
                      const safePreviousArea = previousArea || 0;
                      return (
                        <div key={label}>
                          <DetailedStatsRow
                            style={{
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flex: 1,
                                minWidth: '200px',
                              }}
                            >
                              <StyledIcon
                                name={IconName.forest}
                                style={{
                                  color: '#000000',
                                  width: '20px',
                                  height: '20px',
                                  flexShrink: 0,
                                }}
                              />
                              <InfoLabel style={{ paddingRight: 0 }}>{label}</InfoLabel>
                            </div>
                            <AmountLabel
                              style={{
                                fontSize: '1.8rem',
                                flexShrink: 0,
                                minWidth: 'auto',
                                gap: '4px',
                                marginLeft: 'auto',
                              }}
                            >
                              <span style={{ whiteSpace: 'nowrap' }}>
                                {deforestationStatsFilter === 'count'
                                  ? count
                                  : `${Number(safeArea).toFixed(2)} ha`}
                              </span>
                              {isComparisonEnabled && !isPreviousFetching && (
                                <StatDelta
                                  current={
                                    deforestationStatsFilter === 'count'
                                      ? count
                                      : Number(safeArea.toFixed(2))
                                  }
                                  previous={
                                    deforestationStatsFilter === 'count'
                                      ? previousCount
                                      : Number(safePreviousArea.toFixed(2))
                                  }
                                  isFetching={isPreviousFetching}
                                />
                              )}
                            </AmountLabel>
                          </DetailedStatsRow>
                          {deforestationStatsFilter === 'area' &&
                            label === 'Bendras kertamas plotas' && (
                              <DetailedStatsRow
                                style={{
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  marginTop: 0,
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flex: 1,
                                    minWidth: '200px',
                                  }}
                                >
                                  <InfoLabel
                                    style={{
                                      fontSize: '1.4rem',
                                      color: '#6b7280',
                                      paddingRight: 0,
                                    }}
                                  >
                                    Preliminarus iškirstas plotas pagal kirtimo intensyvumą
                                  </InfoLabel>
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginLeft: 'auto',
                                    justifyContent: 'flex-end',
                                    flexShrink: 0,
                                  }}
                                >
                                  <AmountLabel
                                    style={{
                                      fontSize: '1.4rem',
                                      color: '#6b7280',
                                      minWidth: 'auto',
                                      textAlign: 'right',
                                      flexShrink: 0,
                                      gap: '4px',
                                    }}
                                  >
                                    <span style={{ whiteSpace: 'nowrap' }}>
                                      {Number(
                                        sortedDeforestationStatsArray[0]?.calculatedArea || 0,
                                      ).toFixed(2)}{' '}
                                      ha
                                    </span>
                                    {isComparisonEnabled && (
                                      <StatDelta
                                        current={Number(
                                          Number(
                                            sortedDeforestationStatsArray[0]?.calculatedArea || 0,
                                          ).toFixed(2),
                                        )}
                                        previous={Number(
                                          Number(
                                            sortedDeforestationStatsArray[0]
                                              ?.previousCalculatedArea || 0,
                                          ).toFixed(2),
                                        )}
                                        isFetching={isPreviousFetching}
                                      />
                                    )}
                                  </AmountLabel>
                                  <div
                                    style={{
                                      paddingRight: '2px',
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Tooltip
                                      content={
                                        <div>
                                          Apskaičiuojama pagal kirtimo leidimų tipus ir jiems
                                          priskirtą procentinę dalį nuo numatomo ploto.
                                          <br />
                                          <br />
                                          Plynas, Plynas sanitarinis, Lydimo - 100%
                                          <br />
                                          Atvejiniai - 50%
                                          <br />
                                          Kiti - 25%
                                        </div>
                                      }
                                    >
                                      <Icon
                                        name={IconName.info}
                                        style={{
                                          color: '#6b7280',
                                          fontSize: '1.6rem',
                                          marginTop: '2px',
                                          display: 'flex',
                                        }}
                                      />
                                    </Tooltip>
                                  </div>
                                </div>
                              </DetailedStatsRow>
                            )}
                          <hr
                            style={{
                              border: 'none',
                              borderTop: '2px solid #e5e7eb',
                              margin: '16px 0 8px 0',
                            }}
                          />
                        </div>
                      );
                    })}

                  <CollapsibleContainer $isExpanded={showAllDeforestationStats}>
                    {sortedDeforestationStatsArray
                      ?.slice(1)
                      .map(({ label, count, area, previousCount, previousArea }) => {
                        const safeArea = area || 0;
                        const safePreviousArea = previousArea || 0;
                        const statsPercentage =
                          ((deforestationStatsFilter === 'count' ? count : safeArea) * 100) /
                          highestDeforestationStatsNumber;

                        return (
                          <div key={label}>
                            <DetailedStatsRow
                              style={{
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <InfoLabel style={{ flex: 1, paddingRight: 0, minWidth: '200px' }}>
                                {label}
                              </InfoLabel>
                              <AmountLabel
                                style={{
                                  flexShrink: 0,
                                  minWidth: 'auto',
                                  gap: '4px',
                                  marginLeft: 'auto',
                                }}
                              >
                                <span style={{ whiteSpace: 'nowrap' }}>
                                  {deforestationStatsFilter === 'count'
                                    ? count
                                    : `${Number(safeArea).toFixed(2)} ha`}
                                </span>
                                {isComparisonEnabled && !isPreviousFetching && (
                                  <StatDelta
                                    current={
                                      deforestationStatsFilter === 'count'
                                        ? count
                                        : Number(safeArea.toFixed(2))
                                    }
                                    previous={
                                      deforestationStatsFilter === 'count'
                                        ? previousCount
                                        : Number(safePreviousArea.toFixed(2))
                                    }
                                    isFetching={isPreviousFetching}
                                  />
                                )}
                              </AmountLabel>
                            </DetailedStatsRow>
                            <InfoBarWrapper>
                              <InfoBar $percentage={statsPercentage || 0} />
                            </InfoBarWrapper>
                          </div>
                        );
                      })}
                  </CollapsibleContainer>

                  {sortedDeforestationStatsArray && sortedDeforestationStatsArray.length > 5 && (
                    <ShowMoreButton
                      onClick={() => setShowAllDeforestationStats(!showAllDeforestationStats)}
                    >
                      {showAllDeforestationStats ? 'Rodyti mažiau' : 'Rodyti daugiau'}
                      <ChevronIcon
                        name={IconName.dropdownArrow}
                        $isExpanded={showAllDeforestationStats}
                      />
                    </ShowMoreButton>
                  )}
                </>
              ) : (
                <InfoLabel>Nėra duomenų</InfoLabel>
              )}
            </DetailedStatsWrapper>
          </Row>

          {/* Last Update Section */}
          {!isLoadingLastUpdate && lastUpdateData && (
            <>
              <Separator />
              <LastUpdateSection>
                <SectionTitle>Duomenų atnaujinimo laikas</SectionTitle>
                <LastUpdateGrid>
                  {lastUpdateItems.map((item) => (
                    <LastUpdateCard key={item.label}>
                      <LastUpdateHeader>
                        <LastUpdateIconWrapper>
                          <LastUpdateIcon name={item.icon} />
                        </LastUpdateIconWrapper>
                        <LastUpdateTitle>{item.label}</LastUpdateTitle>
                      </LastUpdateHeader>
                      <LastUpdateBody>
                        <LastUpdateInfo>
                          <LastUpdateRow>
                            <LastUpdateLabel>Paskutinis atnaujinimas:</LastUpdateLabel>
                            <LastUpdateValue $color={getUpdateStatusColor(item.lastUpdate)}>
                              {formatRelativeTime(item.lastUpdate)}
                            </LastUpdateValue>
                            {item.lastUpdate && (
                              <LastUpdateValue
                                style={{ fontSize: '1.4rem', color: '#6b7280', fontWeight: 400 }}
                              >
                                {new Date(item.lastUpdate).toLocaleString('lt-LT')}
                              </LastUpdateValue>
                            )}
                          </LastUpdateRow>
                        </LastUpdateInfo>
                        {item.lastUpdateCount > 0 && (
                          <LastUpdateCountBox>
                            <LastUpdateCountTitle>Gauti</LastUpdateCountTitle>
                            <LastUpdateCountNumber>
                              {item.lastUpdateCount.toLocaleString('lt-LT')}
                            </LastUpdateCountNumber>
                            <LastUpdateCountLabel>nauji įvykiai</LastUpdateCountLabel>
                          </LastUpdateCountBox>
                        )}
                      </LastUpdateBody>
                    </LastUpdateCard>
                  ))}
                </LastUpdateGrid>
              </LastUpdateSection>
            </>
          )}
        </Content>
      )}
    </MainContainer>
  );
};

const MainContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  @media ${device.desktop} {
    max-width: 1520px;
  }
`;

const BannerImageContainer = styled.div`
  width: 100%;
  margin-bottom: -5px;
`;

const Image = styled.img`
  width: 100%;
  object-fit: cover;
  @media ${device.desktop} {
    border-radius: 32px;
  }
`;

const Content = styled.div`
  padding: 40px 0px;
  @media ${device.tablet} {
    flex-wrap: wrap;
    background-color: ${({ theme }) => theme.colors.background};
    padding: 40px 24px;
    margin-top: 0px;
  }
`;

const Row = styled.div`
  align-items: center;
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-top: 40px;
  gap: 24px;
  @media ${device.tablet} {
    flex-wrap: wrap;
    background-color: ${({ theme }) => theme.colors.background};
    flex-direction: column;
  }
`;

const MainStatsWrapper = styled.div`
  flex-direction: column;
  width: 30%;
  @media ${device.tablet} {
    width: 100%;
  }
`;

const MainStatsItem = styled.div`
  display: flex;
  flex-direction: row;
  background-color: white;
  border-radius: 32px;
  padding: 16px;
  gap: 16px;
  margin-bottom: 24px;
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledIcon = styled(Icon)`
  height: 32px;
  width: 32px;
  color: ${({ theme }) => theme.colors.tertiary};
`;

const StatsInfoContainer = styled.div`
  flex-direction: column;
`;

const StatsNumber = styled.div`
  color: ${({ theme }) => theme.colors.text?.secondary};
  font-size: 2rem;
  font-weight: 800;
  line-height: 40px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;

const StatsLabel = styled.div`
  color: ${({ theme }) => theme.colors.text?.secondary};
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 22px;
`;

const DetailedStatsWrapper = styled.div`
  flex-direction: column;
  background-color: white;
  border-radius: 32px;
  padding: 32px;
  width: 35%;
  display: flex;
  @media ${device.tablet} {
    width: 100%;
  }
`;

const StatsHeader = styled.div`
  color: black;
  font-size: 1.8rem;
  font-weight: 600;
  line-height: 26px;
  margin-bottom: 32px;
  min-width: 200px;
`;

const InfoLabel = styled.div`
  color: #0e0e0e;
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 20px;
  word-wrap: break-word;
  padding-right: 16px;
`;

const AmountLabel = styled.div`
  color: #0e0e0e;
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 18px;
  min-width: 100px;
  text-align: end;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const SwitchLabel = styled.div`
  color: #0e0e0e;
  font-size: 1.4rem;
  font-weight: 500;
  line-height: 18px;
`;

const InfoBarWrapper = styled.div`
  height: 8px;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 10px;
`;

const InfoBar = styled.div<{ $percentage: number }>`
  height: 8px;
  width: ${({ $percentage }) => `${$percentage}%`};
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 10px;
`;

const DetailedStatsRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  margin-top: 12px;
  width: 100%;
  flex-wrap: wrap;
`;

const SliderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 8px;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 32px;
  align-self: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
`;

const SliderButton = styled.div<{ $isActive: boolean }>`
  border-radius: 32px;
  padding: 12px;
  cursor: pointer;
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary : theme.colors.background};
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const LoaderContainer = styled.div`
  display: flex;
  width: 100%;
  margin-top: 40px;
  justify-content: center;
  align-items: center;
`;

const Separator = styled.hr`
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 64px 0 40px 0;
  width: 100%;
`;

const LastUpdateSection = styled.div`
  margin-top: 40px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text?.secondary};
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 24px;
  @media ${device.tablet} {
    font-size: 2rem;
  }
`;

const LastUpdateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  @media ${device.tablet} {
    grid-template-columns: 1fr;
  }
`;

const LastUpdateCard = styled.div`
  background-color: white;
  border-radius: 32px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LastUpdateHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};
`;

const LastUpdateIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LastUpdateIcon = styled(Icon)`
  height: 24px;
  width: 24px;
  color: ${({ theme }) => theme.colors.tertiary};
`;

const LastUpdateTitle = styled.div`
  color: ${({ theme }) => theme.colors.text?.secondary};
  font-size: 1.8rem;
  font-weight: 600;
  line-height: 24px;
`;

const LastUpdateBody = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const LastUpdateInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const LastUpdateRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const LastUpdateCountBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 16px;
  padding: 12px 16px;
  min-width: 80px;
  flex-shrink: 0;
`;

const LastUpdateCountTitle = styled.div`
  color: ${({ theme }) => theme.colors.text?.secondary};
  font-size: 1.4rem;
  font-weight: 700;
  text-align: center;
`;

const LastUpdateCountNumber = styled.div`
  color: ${({ theme }) => theme.colors.text?.secondary};
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  @media ${device.tablet} {
    font-size: 1.8rem;
  }
`;

const LastUpdateCountLabel = styled.div`
  color: #6b7280;
  font-size: 1.2rem;
  font-weight: 400;
  text-align: center;
  margin-top: 2px;
`;

const LastUpdateLabel = styled.div`
  color: #6b7280;
  font-size: 1.4rem;
  font-weight: 400;
  line-height: 18px;
`;

const LastUpdateValue = styled.div<{ $color?: string }>`
  color: ${({ $color, theme }) => $color || theme.colors.text?.secondary};
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 20px;
`;

const CollapsibleContainer = styled.div<{ $isExpanded: boolean }>`
  max-height: ${({ $isExpanded }) => ($isExpanded ? '2000px' : '220px')};
  overflow: hidden;
  transition: max-height 0.4s ease-in-out;
`;

const ShowMoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 16px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const ChevronIcon = styled(Icon)<{ $isExpanded: boolean }>`
  width: 24px;
  height: 24px;
  color: currentColor;
  transform: ${({ $isExpanded }) => ($isExpanded ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.4s ease-in-out;
  margin-top: 3px;
`;

const DateRangeLabel = styled.div`
  font-size: 1.6rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.secondary};
  margin-top: 4px;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
`;

const ToggleLabel = styled.span`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text?.secondary || '#374151'};
`;

const ToggleSwitch = styled.div<{ $isActive: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background-color: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary : '#D1D5DB')};
  position: relative;
  transition: background-color 0.3s ease;
`;

const ToggleCircle = styled.div<{ $isActive: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  position: absolute;
  top: 2px;
  left: ${({ $isActive }) => ($isActive ? '22px' : '2px')};
  transition: left 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const MiniSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-left-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export default Stats;
