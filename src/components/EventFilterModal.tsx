import styled from 'styled-components';
import { device, font } from '../styles';
import Icon from './Icons';
import { Button, Modal, useStorage } from '@aplinkosministerija/design-system';
import FilterPicker from './FilterPicker';
import SritysCheckList from './SritysCheckList';
import { isInfostatyba } from '../utils/sritys';
import { useContext, useEffect, useState } from 'react';
import {
  App,
  Category,
  Filters,
  IconName,
  Subscription,
  TimeRangeItem,
  TimeRanges,
  buttonsTitles,
  displayCustomDateFilterLabel,
  formatDateAndTime,
  formatDateFrom,
  formatDateTo,
  subtitle,
  timeRangeItems,
} from '../utils';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { UserContext, UserContextType } from './UserProvider';
import Loader from './Loader';
import InlineDateRangePicker from './InlineDateRangePicker';

interface DateProps {
  start?: Date;
  end?: Date;
}

const EventFilterModal = ({ isMyEvents = false, onClose, visible = false }: any) => {
  const {
    value: filters,
    setValue: setFilters,
    resetValue: resetFilters,
  } = useStorage<Filters>('filters', {}, true);

  const [selectedApps, setSelectedApps] = useState<App[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<Subscription[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeItem[]>([]);
  const [date, setDate] = useState<DateProps | undefined>(undefined);
  const { loggedIn } = useContext<UserContextType>(UserContext);

  const { data: appsResponse, isLoading: loadingApps } = useQuery({
    queryKey: ['apps', 'all'],
    queryFn: () => api.getAllApps(),
  });
  const apps = appsResponse ?? [];

  const { data: subsResponse, isLoading: loadingSubs } = useQuery({
    queryKey: ['subscriptions', 'all'],
    queryFn: () => api.getAllSubscriptions(),
    enabled: loggedIn,
  });
  const subs = subsResponse ?? [];

  const { data: categoriesResponse, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories', 'all', 'infostatyba'],
    queryFn: () => api.getAllCategories('infostatyba'),
  });
  const categories = categoriesResponse ?? [];

  const clearFilter = () => {
    resetFilters();
    onModalClose();
  };

  useEffect(() => {
    if (visible) {
      setSelectedApps(filters.apps || []);
      setSelectedSubs(filters.subscriptions || []);
      setSelectedCategories(filters.categories || []);
      setSelectedTimeRange(filters.timeRange ? [filters.timeRange] : []);
      if (filters?.timeRange?.key === TimeRanges.CUSTOM) {
        setDate({
          start: new Date(filters?.timeRange?.query?.$gte),
          end: new Date(filters?.timeRange?.query?.$lt),
        });
      }
    }
    // Seeds the draft selection from the applied filters only as the modal
    // opens. Depending on filters.* would re-seed mid-edit and wipe whatever
    // the user has ticked since.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onModalClose = () => {
    setDate(undefined);
    onClose();
  };

  // Categories only apply while an infostatyba app is actually selected; the
  // picks stay in local state so toggling the app back on restores them.
  const infostatybaSelected = selectedApps.some((app) => isInfostatyba(app));

  const onFilterClick = () => {
    setFilters({
      ...(selectedApps.length > 0 ? { apps: selectedApps } : null),
      ...(selectedSubs.length > 0 ? { subscriptions: selectedSubs } : null),
      // Only apply category filter when infostatyba is actually selected —
      // selections are preserved in local state so toggling the app back on
      // restores them, but they shouldn't filter while the app is off.
      ...(infostatybaSelected && selectedCategories.length > 0
        ? { categories: selectedCategories }
        : null),
      ...(selectedTimeRange ? { timeRange: selectedTimeRange[0] } : null),
    });
    onModalClose();
  };

  const renderSubs = () => {
    if (loadingSubs) {
      return <Loader />;
    }
    if (isMyEvents && subs?.length > 0) {
      return (
        <FilterGroup>
          <Subtitle>{subtitle.subscriptions}</Subtitle>
          <FilterPicker
            allowMultipleSelection
            getItemKey={(item) => item.id}
            data={subs}
            selectedItems={selectedSubs}
            setSelectedItems={(items) => setSelectedSubs(items)}
          />
        </FilterGroup>
      );
    }
  };

  // Sritys + categories share one control (SritysCheckList) with the homepage /
  // map filter and the subscription form. This modal stores whole App/Category
  // objects, so the id-based component is bridged back to them here.
  const renderApps = () => {
    if (loadingApps || loadingCategories) {
      return <Loader />;
    }
    if (!apps?.length) return null;

    const appsById = new Map(apps.map((a) => [a.id, a]));
    const categoriesById = new Map(categories.map((c) => [c.id, c]));

    return (
      <FilterGroup>
        <Subtitle>{subtitle.apps}</Subtitle>
        <SritysCheckList
          apps={apps}
          categories={categories}
          appIds={selectedApps.map((a) => a.id)}
          onAppIdsChange={(ids) =>
            setSelectedApps(ids.map((id) => appsById.get(id)).filter(Boolean) as App[])
          }
          // One flat category list shared across the infostatyba apps — the
          // events query filters by categoryGroup, not per app.
          catsFor={() => selectedCategories.map((c) => c.id)}
          onCatsChange={(appId, ids) => {
            setSelectedCategories(
              ids.map((id) => categoriesById.get(id)).filter(Boolean) as Category[],
            );
            // Picking categories implies the owning app is selected.
            if (ids.length && !selectedApps.some((a) => a.id === appId)) {
              const app = appsById.get(appId);
              if (app) setSelectedApps([...selectedApps, app]);
            }
          }}
        />
      </FilterGroup>
    );
  };

  const timeRanges: TimeRangeItem[] = timeRangeItems.map((item) => {
    if (item.key === TimeRanges.CUSTOM && selectedTimeRange[0]?.key === TimeRanges.CUSTOM) {
      return { ...item, name: displayCustomDateFilterLabel(date) };
    } else {
      return item;
    }
  });

  return (
    <Modal visible={visible} onClose={onModalClose}>
      <Container data-modal-card>
        <HeaderWrapper>
          <Title>{buttonsTitles.filter}</Title>
          <IconContainer onClick={onModalClose} aria-label={buttonsTitles.close}>
            <StyledIcon name={IconName.close} />
          </IconContainer>
        </HeaderWrapper>

        {renderSubs()}

        <FilterGroup>
          <Subtitle>{subtitle.date}</Subtitle>
          <FilterPicker
            getItemKey={(item) => item.key}
            data={timeRanges}
            selectedItems={selectedTimeRange}
            setSelectedItems={(items) => {
              if (items[0]?.key === TimeRanges.CUSTOM) {
                setDate({
                  start: new Date(items[0]?.query.$gte),
                  end: new Date(items[0]?.query.$lt),
                });
              } else {
                setDate(undefined);
              }
              setSelectedTimeRange(items);
            }}
          />
          {!!date && selectedTimeRange[0]?.key === TimeRanges.CUSTOM && (
            <InlineDateRangePicker
              onDateChange={(val) => {
                setDate({ start: val.start, end: val.end });
                setSelectedTimeRange([
                  {
                    key: TimeRanges.CUSTOM,
                    name: 'Pasirinkite datą',
                    query: {
                      $gte: formatDateAndTime(formatDateFrom(val.start)),
                      $lt: formatDateAndTime(formatDateTo(val.end || val.start)),
                    },
                  },
                ]);
              }}
              startDate={date?.start}
              endDate={date?.end}
            />
          )}
        </FilterGroup>

        <Divider />

        {renderApps()}

        <Footer>
          <ClearFilterText onClick={clearFilter}>{buttonsTitles.clearFilter}</ClearFilterText>
          <FilterButton onClick={onFilterClick}>{buttonsTitles.filter}</FilterButton>
        </Footer>
      </Container>
    </Modal>
  );
};

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: column;
`;

const StyledIcon = styled(Icon)`
  font-size: 2.4rem;
`;

const Container = styled.div<{ width?: string; $backgroundImg?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: white;
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  margin: auto;
  padding: 16px;
  ${({ $backgroundImg }) =>
    $backgroundImg
      ? ` background-image: url('/empty-bg.svg');
                background-repeat: no-repeat;
                background-position: 50%;
                background-size: cover;`
      : ''}

  @media ${device.desktop} {
    max-width: 841px;
    height: auto;
    overflow: initial;
    min-height: auto;
    padding: 24px;
    flex-basis: auto;
    border-radius: 8px;
  }
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  cursor: pointer;
  opacity: 0.8;
  text-decoration: none;
`;

const Title = styled.div`
  ${font('2xl')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

// Full-bleed bar across the modal's foot, per the design: it escapes the 24px
// padding so its rule reaches both edges.
const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 -24px -24px;
  padding: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};

  @media ${device.mobileL} {
    margin: 0 -16px -16px;
    padding: 16px;
  }
`;

const ClearFilterText = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: underline;
  cursor: pointer;
`;

const Subtitle = styled.div`
  ${font('base', 500)};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  margin: 0;
`;

const FilterButton = styled(Button)`
  width: 205px;
  height: 40px;
  min-height: 40px;
  padding: 8px 24px;
  border-radius: 54px;
  background-color: ${({ theme }) => theme.colors.black};
  border-color: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base')};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.grey[700]};
    border-color: ${({ theme }) => theme.colors.grey[700]};
  }
`;

export default EventFilterModal;
