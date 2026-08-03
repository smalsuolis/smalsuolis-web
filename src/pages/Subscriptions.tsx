import { Button, CheckBox } from '@aplinkosministerija/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import EmptyState from '../components/EmptyState';
import LoaderComponent from '../components/LoaderComponent';
import Popup from '../components/Popup';
import SubscriptionModal from '../components/SubscriptionModal';
import SubscriptionRow from '../components/SubscriptionRow';
import { ButtonVariants, CONTENT_WIDTH, checkmarkNudge, device } from '../styles';
import { App, slugs, Subscription, useInfinityLoad } from '../utils';
import api from '../utils/api';

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const Subscriptions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const observerRef = useRef<any>(null);
  // `id` is present when mounted on /prenumeratos/:id — the form modal opens
  // over the list, so old links and emails still resolve.
  const { id } = useParams();
  const [anyEventsCountNull, setAnyEventsCountNull] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [modalId, setModalId] = useState<string | undefined>(id);
  const modalVisible = !!id || modalId !== undefined;

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

  // Active toggles don't change anything else server-side, so the optimistic
  // update is canonical — only `user` needs refreshing for its active-sub
  // count. Refetching `subscriptions` would flicker the bottom loader.
  const invalidateUser = () => queryClient.invalidateQueries({ queryKey: ['user'] });

  const clearSelection = () => setSelectedIds(new Set());

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.setSubscriptionsActive({ ids: [id], active }),
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
    onSuccess: invalidateUser,
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
    onSuccess: () => {
      clearSelection();
      invalidateUser();
    },
  });

  const { mutate: bulkRemove, isPending: bulkRemovePending } = useMutation({
    mutationFn: (ids: number[]) => api.deleteSubscriptions(ids),
    onSuccess: () => {
      clearSelection();
      setShowBulkDelete(false);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      invalidateUser();
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

  // Opening/closing keeps the URL in step so the modal is linkable, but the list
  // stays mounted underneath rather than navigating away to a separate page.
  const openModal = (subscriptionId?: string) => {
    setModalId(subscriptionId ?? 'nauja');
    navigate(slugs.subscription(subscriptionId ?? 'nauja'), { replace: true });
  };

  const closeModal = () => {
    setModalId(undefined);
    navigate(slugs.subscriptions, { replace: true });
  };

  const renderContent = () => {
    if (isLoading) return <LoaderComponent />;

    if (emptySubscriptions) {
      return (
        <EmptyState
          title="Sužinokite, kas vyksta šalia"
          description="Pridėkite teritoriją ir stebėkite, kas planuojama jūsų kieme, rajone ar mieste."
          image="/empty_search.png"
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
                    <SubscriptionRow
                      subscription={subscription}
                      onClick={() => openModal(subscription?.id?.toString())}
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
    <>
      <Container>
        <PageHeader>
          <PageTitle>Prenumeratos</PageTitle>
          <AddButton type="button" onClick={() => openModal()}>
            <PlusIcon />
            Pridėti naują
          </AddButton>
        </PageHeader>
        {renderContent()}
      </Container>
      <SubscriptionModal
        visible={modalVisible}
        id={id ?? modalId}
        onClose={closeModal}
        onSaved={clearSelection}
      />
      <Popup
        visible={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        image="/warning_triangle.png"
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
    </>
  );
};

export default Subscriptions;

// Full-bleed page: the nav's 1216px content width is matched here rather than
// inherited from DefaultLayout's padded grey container.
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${CONTENT_WIDTH};
  margin: 0 auto;
  padding: 40px 32px 64px;

  @media ${device.mobileL} {
    padding: 24px 20px 48px;
  }
`;

const SubscriptionsContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
`;

// No horizontal padding: the select-all checkbox has to sit on the same left
// edge as the per-row checkboxes below it, which are flush with the row.
const SelectionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  flex-wrap: wrap;
  ${checkmarkNudge};
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

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 3.2rem;
  font-weight: 500;

  @media ${device.mobileL} {
    font-size: 2.8rem;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: 24px;
  background: #1a1a1a;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  flex-shrink: 0;

  @media ${device.mobileL} {
    width: 100%;
  }
`;

const Invisible = styled.div`
  width: 10px;
  height: 16px;
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
