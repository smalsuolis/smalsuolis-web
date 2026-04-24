import { ContentLayout } from '@aplinkosministerija/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import EmptyState from '../components/EmptyState';
import LoaderComponent from '../components/LoaderComponent';
import SubscriptionCard from '../components/SubscriptionCard';
import { device } from '../styles';
import { App, IconName, slugs, Subscription, useGetCurrentRoute, useInfinityLoad } from '../utils';
import api from '../utils/api';

const Subscriptions = () => {
  const currentRoute = useGetCurrentRoute();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const observerRef = useRef<any>(null);
  const [anyEventsCountNull, setAnyEventsCountNull] = useState(false);

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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const emptySubscriptions = !subscriptions?.pages[0]?.data?.length;

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
