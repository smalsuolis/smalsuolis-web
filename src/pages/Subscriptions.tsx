import { Button, CheckBox, ContentLayout } from '@aplinkosministerija/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import EmptyState from '../components/EmptyState';
import LoaderComponent from '../components/LoaderComponent';
import Popup from '../components/Popup';
import SubscriptionCard from '../components/SubscriptionCard';
import { ButtonVariants, device } from '../styles';
import { App, IconName, slugs, Subscription, useGetCurrentRoute, useInfinityLoad } from '../utils';
import api from '../utils/api';

const Subscriptions = () => {
  const currentRoute = useGetCurrentRoute();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const observerRef = useRef<any>(null);
  const [anyEventsCountNull, setAnyEventsCountNull] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const {
    data: subscriptions,
    isFetching,
    isLoading,
  } = useInfinityLoad(['subscriptions'], api.getSubscriptions, observerRef, {}, true, (data) => {
    const anyEventsCountNull = data?.some((event) => event.eventsCount === null) || false;
    setAnyEventsCountNull(anyEventsCountNull);
    return anyEventsCountNull ? 2000 : false;
  });

  const { data: appsResponse } = useQuery({
    queryKey: ['apps'],
    queryFn: () => api.getApps({ page: 1 }),
  });

  const visibleSubscriptions = useMemo<Subscription<App>[]>(
    () => subscriptions?.pages.flatMap((p: { data: Subscription<App>[] }) => p.data) ?? [],
    [subscriptions],
  );

  const invalidateSubscriptions = () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.updateSubscription({ id, params: { active } }),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ['subscriptions'] });
      const previous = queryClient.getQueryData(['subscriptions']);
      queryClient.setQueryData(['subscriptions'], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((sub: Subscription<App>) =>
              sub.id === id ? { ...sub, active } : sub,
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['subscriptions'], context.previous);
      }
    },
    onSettled: invalidateSubscriptions,
  });

  const { mutate: bulkSetActive, isPending: bulkSetActivePending } = useMutation({
    mutationFn: ({ ids, active }: { ids: number[]; active: boolean }) =>
      api.setSubscriptionsActive({ ids, active }),
    onMutate: async ({ ids, active }) => {
      await queryClient.cancelQueries({ queryKey: ['subscriptions'] });
      const previous = queryClient.getQueryData(['subscriptions']);
      const idSet = new Set(ids);
      queryClient.setQueryData(['subscriptions'], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((sub: Subscription<App>) =>
              idSet.has(sub.id) ? { ...sub, active } : sub,
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['subscriptions'], context.previous);
      }
    },
    onSettled: invalidateSubscriptions,
    onSuccess: clearSelection,
  });

  const { mutate: bulkRemove, isPending: bulkRemovePending } = useMutation({
    mutationFn: (ids: number[]) => api.deleteSubscriptions(ids),
    onSuccess: () => {
      clearSelection();
      setShowBulkDelete(false);
      invalidateSubscriptions();
    },
  });

  const emptySubscriptions = !subscriptions?.pages[0]?.data?.length;
  const visibleIds = visibleSubscriptions.map((s) => s.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;
  const selectionActive = selectedIds.size > 0;
  const bulkBusy = bulkSetActivePending || bulkRemovePending;

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(visibleIds) : new Set());
  };

  const renderContent = () => {
    if (isLoading) return <LoaderComponent />;

    if (emptySubscriptions) {
      return (
        <EmptyState
          title="Jūs neturite prenumeratų"
          description="Kad galėtumėte matyti naujienas jūsų pasirinktomis temomis bei gautumėte naujienlaiškius elektroniniu paštu, sukurkite naują prenumeratą."
          icon={IconName.airBallon}
        />
      );
    }

    return (
      <SubscriptionsContainer>
        <SelectionBar>
          <SelectAllRow>
            <CheckBox value={allSelected} intermediate={someSelected} onChange={toggleSelectAll} />
            <SelectAllLabel>
              {selectionActive ? `Pažymėta: ${selectedIds.size}` : 'Pažymėti visas'}
            </SelectAllLabel>
          </SelectAllRow>
          {selectionActive && (
            <BulkActions>
              <BulkButton
                variant={ButtonVariants.SECONDARY}
                disabled={bulkBusy}
                onClick={() => bulkSetActive({ ids: Array.from(selectedIds), active: true })}
              >
                {`Aktyvuoti (${selectedIds.size})`}
              </BulkButton>
              <BulkButton
                variant={ButtonVariants.SECONDARY}
                disabled={bulkBusy}
                onClick={() => bulkSetActive({ ids: Array.from(selectedIds), active: false })}
              >
                {`Deaktyvuoti (${selectedIds.size})`}
              </BulkButton>
              <BulkButton
                variant={ButtonVariants.DANGER}
                disabled={bulkBusy}
                onClick={() => setShowBulkDelete(true)}
              >
                {`Ištrinti (${selectedIds.size})`}
              </BulkButton>
            </BulkActions>
          )}
        </SelectionBar>
        {subscriptions?.pages.map((page: { data: Subscription<App>[] }, pageIndex: number) => {
          return (
            <React.Fragment key={pageIndex}>
              {page?.data.map((subscription) => {
                return (
                  <React.Fragment key={`subscription-${subscription?.id}`}>
                    <SubscriptionCard
                      subscription={subscription}
                      onClick={() => navigate(slugs.subscription(subscription?.id?.toString()))}
                      onToggleActive={(active) => toggleActive({ id: subscription.id, active })}
                      selected={selectedIds.has(subscription.id)}
                      onSelect={(checked) => toggleSelect(subscription.id, checked)}
                      apps={appsResponse?.rows}
                    />
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
        {observerRef && <Invisible ref={observerRef} />}
        {!anyEventsCountNull && isFetching && <LoaderComponent />}
      </SubscriptionsContainer>
    );
  };

  return (
    <ContentLayout currentRoute={currentRoute}>
      <Container>
        <ButtonsContainer>
          <NewSubscriptionButton onClick={() => navigate(slugs.subscription('nauja'))}>
            Nauja teritorija
          </NewSubscriptionButton>
        </ButtonsContainer>
        {renderContent()}
      </Container>
      <Popup
        visible={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        title={`Ar tikrai norite ištrinti pažymėtas prenumeratas (${selectedIds.size})?`}
        subTitle="Šio veiksmo nebus galima atšaukti ar redaguoti"
        allow
      >
        <PopupActions>
          <PopupButton variant={ButtonVariants.SECONDARY} onClick={() => setShowBulkDelete(false)}>
            Atšaukti
          </PopupButton>
          <PopupButton
            variant={ButtonVariants.DANGER}
            disabled={bulkRemovePending}
            onClick={() => bulkRemove(Array.from(selectedIds))}
          >
            Ištrinti
          </PopupButton>
        </PopupActions>
      </Popup>
    </ContentLayout>
  );
};

export default Subscriptions;

const Container = styled.div`
  display: flex;
  overflow-y: auto;
  flex-direction: column;
  padding: 32px 0;
  width: 100%;

  @media ${device.mobileL} {
    padding: 0;
  }
`;

const SubscriptionsContainer = styled.div`
  display: flex;
  max-width: 800px;
  margin: auto;
  width: 100%;
  gap: 12px;
  flex-direction: column;
`;

const SelectionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px;
  flex-wrap: wrap;
`;

const SelectAllRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SelectAllLabel = styled.span`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const BulkActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const BulkButton = styled(Button)`
  height: 36px;
  font-size: 1.3rem;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: 16px;
  margin-left: auto;
`;

const Invisible = styled.div`
  width: 10px;
  height: 16px;
`;

const NewSubscriptionButton = styled.a`
  color: #1f5c2e;
  text-decoration: underline;
  float: right;
  width: fit-content;
  margin-left: auto;
  cursor: pointer;
`;

const PopupActions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
  @media ${device.mobileL} {
    padding: 0 16px;
  }
`;

const PopupButton = styled(Button)`
  height: 40px;
`;
