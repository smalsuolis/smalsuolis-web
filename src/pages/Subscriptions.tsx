import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import EmptyState from '../components/EmptyState';
import LoaderComponent from '../components/LoaderComponent';
import SubscriptionModal from '../components/SubscriptionModal';
import SubscriptionRow from '../components/SubscriptionRow';
import { CONTENT_WIDTH, device, font } from '../styles';
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

  // Active toggles don't change anything else server-side, so the optimistic
  // update is canonical — only `user` needs refreshing for its active-sub
  // count. Refetching `subscriptions` would flicker the bottom loader.
  const invalidateUser = () => queryClient.invalidateQueries({ queryKey: ['user'] });

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

  const emptySubscriptions = !subscriptions?.pages[0]?.data?.length;

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
      <>
        <SubscriptionsContainer>
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
                        apps={appsResponse?.rows}
                      />
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </SubscriptionsContainer>
        {observerRef && <Invisible ref={observerRef} />}
        {!anyEventsCountNull && isFetching && <LoaderComponent />}
      </>
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
      <SubscriptionModal visible={modalVisible} id={id ?? modalId} onClose={closeModal} />
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
  padding: 0 32px;

  @media ${device.mobileL} {
    padding: 0 16px;
  }
`;

const SubscriptionsContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 36px;

  @media ${device.mobileL} {
    gap: 24px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 48px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
    gap: 24px;
    margin-bottom: 42px;
  }
`;

const PageTitle = styled.h1`
  margin: 0;
  ${font('3xl')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 165px;
  height: 40px;
  padding: 8px 24px;
  border: none;
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base')};
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
