import { CheckBox, device, Switch } from '@aplinkosministerija/design-system';
import styled from 'styled-components';
import { App, Frequency, IconName, Subscription } from '../utils';
import AppItem from './AppsItem';
import Icon from './Icons';
import Loader from './Loader';

const frequencyLabels = {
  [Frequency.DAY]: 'Dienos įvykiai',
  [Frequency.WEEK]: 'Savaitės įvykiai',
  [Frequency.MONTH]: 'Mėnesio įvykiai',
};

const SubscriptionCard = ({
  subscription,
  onClick,
  onToggleActive,
  selected,
  onSelect,
  apps = [],
}: {
  subscription: Subscription<App>;
  onClick: () => void;
  onToggleActive?: (active: boolean) => void;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
  apps?: App[];
}) => {
  const futureApps = subscription?.apps?.length === 0;
  const allApps = !futureApps && subscription?.apps?.length === apps?.length;
  const showApps = !futureApps && !allApps;
  const { eventsCount } = subscription;
  const isActive = subscription?.active !== false;

  return (
    <Container>
      <InnerContainer $inactive={!isActive} $selected={!!selected}>
        {onSelect && (
          <CheckboxWrapper onClick={(e) => e.stopPropagation()}>
            <CheckBox value={!!selected} onChange={(value) => onSelect(value)} />
          </CheckboxWrapper>
        )}
        <Content onClick={onClick} $inactive={!isActive}>
          <Name>
            {`${subscription?.name ?? (subscription?.frequency && frequencyLabels[subscription?.frequency])}`}{' '}
          </Name>
          <AppsContainer>
            {futureApps && (
              <AppItem
                icon={<Icon name={IconName.search} />}
                text={'Automatinis naujų sričių pridėjimas'}
                selected={true}
              />
            )}
            {allApps && (
              <AppItem
                icon={<Icon name={IconName.search} />}
                text={'Esu smalsus domina viskas'}
                selected={true}
              />
            )}
            {showApps &&
              subscription.apps?.map((app: App) => {
                return <AppItem key={`app_${app.id}`} app={app} selected={true} />;
              })}
          </AppsContainer>
        </Content>
        <RightColumn>
          {onToggleActive && (
            <SwitchWrapper
              onClick={(e) => e.stopPropagation()}
              title={
                isActive
                  ? 'Prenumerata aktyvi — naujienos siunčiamos el. paštu'
                  : 'Prenumerata neaktyvi — naujienos nesiunčiamos'
              }
            >
              {!isActive && <InactiveLabel>Neaktyvi</InactiveLabel>}
              <Switch value={isActive} onChange={(e) => onToggleActive(e.target.checked)} />
            </SwitchWrapper>
          )}
          <EventsCount $inactive={!isActive}>
            <EventsCountLabel>{'Įvykių skaičius'}</EventsCountLabel>
            {eventsCount === null ? (
              <Loader size="30px" />
            ) : (
              <>
                <EventsCountAllTime>{eventsCount?.allTime}</EventsCountAllTime>
                {!!eventsCount?.new && <EventsCountNew>{`+ ${eventsCount.new}`}</EventsCountNew>}
              </>
            )}
          </EventsCount>
        </RightColumn>
      </InnerContainer>
    </Container>
  );
};

export default SubscriptionCard;

const Container = styled.div`
  width: 100%;
  cursor: pointer;
`;

const EventsCountLabel = styled.div`
  font-size: 1.2rem;
  font-weight: 400;
  line-height: 10.08px;
  color: ${({ theme }) => theme.colors.text.secondary};
  @media ${device.mobileS} {
    font-size: 0.8rem;
  }
`;

const EventsCountAllTime = styled.div`
  font-size: 2rem;
  font-weight: 700;
  line-height: 22.68px;
  color: black;
  @media ${device.mobileS} {
    font-size: 1.8rem;
  }
`;

const EventsCountNew = styled.div`
  font-size: 1.4rem;
  font-weight: 400;
  line-height: 15.12px;
  color: #1b4c28;
  @media ${device.mobileS} {
    font-size: 1.2rem;
  }
`;

const EventsCount = styled.div<{ $inactive?: boolean }>`
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 3px;
  opacity: ${({ $inactive }) => ($inactive ? 0.5 : 1)};
  transition: opacity 0.2s;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
`;

const SwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InactiveLabel = styled.span`
  font-size: 1.2rem;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.text.secondary};
  @media ${device.mobileS} {
    font-size: 0.8rem;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
  margin-right: 12px;
`;

const InnerContainer = styled.div<{ $inactive?: boolean; $selected?: boolean }>`
  display: flex;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 8px;
  background: ${({ theme, $inactive, $selected }) =>
    $selected ? '#e8f0ea' : $inactive ? 'transparent' : theme.colors.GREY};
  border: 1px
    ${({ $inactive, $selected }) => ($selected ? 'solid' : $inactive ? 'dashed' : 'solid')}
    ${({ $inactive, $selected }) => ($selected ? '#1f5c2e' : $inactive ? '#d0d0d0' : 'transparent')};
  transition:
    background 0.2s,
    border-color 0.2s;
`;

const Content = styled.div<{ $inactive?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  opacity: ${({ $inactive }) => ($inactive ? 0.5 : 1)};
  transition: opacity 0.2s;
`;

const Name = styled.div`
  font-size: 2rem;
  font-weight: bold;
  @media ${device.mobileS} {
    font-size: 1.8rem;
  }
`;

const AppsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 8px;
  margin-top: 16px;
`;
