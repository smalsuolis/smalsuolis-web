import { useState } from 'react';
import styled from 'styled-components';
import Icon from '../components/Icons';
import { device } from '../styles';
import { Frequency, IconName, timeRangeQuery } from '../utils';
import { TimeRanges } from '../utils/types';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import Loader from '../components/Loader';
import Datepicker from '../components/Datepicker';
import { orderBy } from 'lodash';
import { formatRelativeTime, getUpdateStatusColor } from '../utils/functions';
import Tooltip from '../components/Tooltip';

const bannerUrl = '/stats_banner.png';

const Stats = () => {
  const [deforestationStatsFilter, setDeforestationStatsFilter] = useState('count');
  const [showAllDeforestationStats, setShowAllDeforestationStats] = useState(false);
  const [query, setQuery] = useState<{ $gte: string; $lt: string }>(
    timeRangeQuery[TimeRanges.LAST_7_DAYS],
  );
  const [dateFilter, setDateFilter] = useState<string>(TimeRanges.LAST_7_DAYS);

  const { data, isLoading } = useQuery({
    queryKey: ['stats', query],
    queryFn: () => api.getStats(query),
  });

  const { data: lastUpdateData, isLoading: isLoadingLastUpdate } = useQuery({
    queryKey: ['lastUpdate'],
    queryFn: () => api.getLastUpdate(),
  });

  const mainStatsData = [
    { label: 'Įvykių', count: data?.count, icon: IconName.heart },
    {
      label: 'Kirtimų leidimų',
      count: data?.byApp?.miskoKirtimai?.count,
      icon: IconName.forest,
    },
    {
      label: 'Žuvinimų',
      count: data?.byApp?.izuvinimas?.count,
      icon: IconName.fishThin,
    },
    {
      label: 'Statybos leidimų',
      count: data?.byApp?.infostatyba?.count,
      icon: IconName.house,
    },
  ];

  const constructionsStatsByTag = data?.byApp?.infostatyba?.byTag;
  const deforestationStatsByTag = data?.byApp?.miskoKirtimai?.byTag;

  const constructionsStatsArray =
    constructionsStatsByTag &&
    Object.keys(constructionsStatsByTag).reduce(
      (acc: Array<{ label: string; count: number }>, key) => {
        acc.push({ label: key, count: constructionsStatsByTag[key].count });
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
      (acc: Array<{ label: string; count: number; area: number; calculatedArea: number }>, key) => {
        // @ts-expect-error type missing calculatedArea
        const calculatedArea = deforestationStatsByTag[key].calculatedArea || 0;
        acc.push({
          label: key,
          count: deforestationStatsByTag[key].count || 0,
          area: deforestationStatsByTag[key].area || 0,
          calculatedArea,
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
    const totalArea = sortedDeforestationStatsArray.reduce(
      (acc, item) => acc + Number(item.area || 0),
      0,
    );
    const totalCalculatedArea = sortedDeforestationStatsArray.reduce(
      (acc, item) => acc + Number(item.calculatedArea || 0),
      0,
    );

    sortedDeforestationStatsArray.unshift({
      label:
        deforestationStatsFilter === 'count'
          ? 'Bendras leidimų skaičius'
          : 'Bendras kertamas plotas',
      count: totalCount,
      area: totalArea,
      calculatedArea: totalCalculatedArea,
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

  const lastUpdateItems = [
    {
      label: 'Miško kirtimai',
      lastUpdate: miskoKirtimaiUpdate?.lastUpdate || null,
      icon: IconName.forest,
    },
    {
      label: 'Žuvų įveisimas',
      lastUpdate: izuvinimasUpdate?.lastUpdate || null,
      icon: IconName.fishThin,
    },
    {
      label: 'Statybos leidimai',
      lastUpdate: infostatybaUpdate?.lastUpdate || null,
      icon: IconName.house,
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
          <Datepicker
            onChange={(filterValue, date) => {
              setDateFilter(filterValue);
              setQuery(date);
            }}
            value={dateFilter}
            selectedDates={query}
          />

          <Row>
            <MainStatsWrapper>
              {mainStatsData.map((item) => (
                <MainStatsItem key={item.label}>
                  <IconWrapper>
                    <StyledIcon name={item.icon} />
                  </IconWrapper>
                  <StatsInfoContainer>
                    <StatsNumber>{item.count || '0'}</StatsNumber>
                    <StatsLabel>{item.label}</StatsLabel>
                  </StatsInfoContainer>
                </MainStatsItem>
              ))}
            </MainStatsWrapper>
            <DetailedStatsWrapper>
              <StatsHeader>Statybų leidimai</StatsHeader>

              {constructionsStatsByTag ? (
                sortedConstructionsStatsArray?.map(({ label, count }) => {
                  const statsPercentage = (count * 100) / highestConstructionsStatsNumber;
                  return (
                    <>
                      <DetailedStatsRow key={label}>
                        <InfoLabel>{label}</InfoLabel>
                        <AmountLabel>{count}</AmountLabel>
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
                  {sortedDeforestationStatsArray?.slice(0, 1).map(({ label, count, area }) => {
                    const safeArea = area || 0;
                    return (
                      <div key={label}>
                        <DetailedStatsRow
                          style={{ alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StyledIcon
                              name={IconName.forest}
                              style={{ color: '#000000', width: '20px', height: '20px' }}
                            />
                            <InfoLabel>{label}</InfoLabel>
                          </div>
                          <AmountLabel style={{ fontSize: '1.8rem' }}>
                            {deforestationStatsFilter === 'count'
                              ? count
                              : `${Number(safeArea).toFixed(2)} ha`}
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
                                  style={{ fontSize: '1.4rem', color: '#6b7280', paddingRight: 0 }}
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
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                <AmountLabel
                                  style={{
                                    fontSize: '1.4rem',
                                    color: '#6b7280',
                                    minWidth: 'auto',
                                    textAlign: 'right',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                  }}
                                >
                                  {Number(
                                    sortedDeforestationStatsArray[0]?.calculatedArea || 0,
                                  ).toFixed(2)}{' '}
                                  ha
                                </AmountLabel>
                                <div style={{ paddingRight: '2px' }}>
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
                    {sortedDeforestationStatsArray?.slice(1).map(({ label, count, area }) => {
                      const safeArea = area || 0;
                      const statsPercentage =
                        ((deforestationStatsFilter === 'count' ? count : safeArea) * 100) /
                        highestDeforestationStatsNumber;

                      return (
                        <div key={label}>
                          <DetailedStatsRow>
                            <InfoLabel>{label}</InfoLabel>
                            <AmountLabel>
                              {deforestationStatsFilter === 'count'
                                ? count
                                : `${Number(safeArea).toFixed(2)} ha`}
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
  grid-template-columns: repeat(3, 1fr);
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

const LastUpdateInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LastUpdateRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
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

export default Stats;
