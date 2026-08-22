import { Switch } from '@aplinkosministerija/design-system';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { css } from 'styled-components';
import { device, font, rowHoverTint } from '../styles';
import { App, Frequency, Subscription } from '../utils';
import Loader from './Loader';

const frequencyLabels = {
  [Frequency.DAY]: 'Dienos įvykiai',
  [Frequency.WEEK]: 'Savaitės įvykiai',
  [Frequency.MONTH]: 'Mėnesio įvykiai',
};

// How many app chips are shown before collapsing the rest behind "+N daugiau".
const COLLAPSED_CHIP_COUNT = 5;

const AutoIcon = () => (
  <AutoBadge aria-hidden="true">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path
        d="M5.2 11.2 8 4.8l2.8 6.4M6.2 9.4h3.6"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </AutoBadge>
);

const ChevronRight = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m9 6 6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronDown = ({ $up }: { $up?: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ transform: $up ? 'rotate(180deg)' : undefined }}
  >
    <path
      d="m6 9 6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SubscriptionRow = ({
  subscription,
  onClick,
  onToggleActive,
  apps = [],
}: {
  subscription: Subscription<App>;
  onClick: () => void;
  onToggleActive?: (active: boolean) => void;
  apps?: App[];
}) => {
  const [expanded, setExpanded] = useState(false);

  const futureApps = subscription?.apps?.length === 0;
  const { eventsCount } = subscription;
  const isActive = subscription?.active !== false;

  // With futureApps on, the subscription stores no explicit apps — it tracks
  // every app, so show them all as chips rather than an empty row.
  const chipApps = useMemo<App[]>(
    () => (futureApps ? apps : subscription.apps || []),
    [futureApps, apps, subscription.apps],
  );

  const hiddenCount = Math.max(0, chipApps.length - COLLAPSED_CHIP_COUNT);
  const visibleApps = expanded ? chipApps : chipApps.slice(0, COLLAPSED_CHIP_COUNT);

  const name =
    subscription?.name ||
    (subscription?.frequency && frequencyLabels[subscription.frequency]) ||
    '';

  return (
    <Row $inactive={!isActive}>
      <TopRow>
        <LeftSide>
          {onToggleActive && (
            <SwitchWrapper
              onClick={(e) => e.stopPropagation()}
              title={
                isActive
                  ? 'Prenumerata aktyvi — naujienos siunčiamos el. paštu'
                  : 'Prenumerata neaktyvi — naujienos nesiunčiamos'
              }
            >
              <Switch value={isActive} onChange={(e) => onToggleActive(e.target.checked)} />
            </SwitchWrapper>
          )}
          <Name onClick={onClick} $inactive={!isActive}>
            {name}
          </Name>
        </LeftSide>
        <RightSide onClick={onClick}>
          {futureApps && (
            <AutoLabel>
              <AutoIcon />
              <AutoText>Automatinis sričių pridėjimas aktyvuotas</AutoText>
            </AutoLabel>
          )}
          <Count $inactive={!isActive}>
            {eventsCount === null ? (
              <Loader size="24px" />
            ) : (
              <>
                <CountAllTime>{eventsCount?.allTime?.toLocaleString('lt-LT')}</CountAllTime>
                {!!eventsCount?.new && <CountNew>{`+ ${eventsCount.new}`}</CountNew>}
              </>
            )}
          </Count>
          <ChevronButton type="button" aria-label={`Atidaryti ${name}`}>
            <ChevronRight />
          </ChevronButton>
        </RightSide>
      </TopRow>
      {chipApps.length > 0 && (
        <ChipRow $inactive={!isActive}>
          {visibleApps.map((app) => (
            <Chip key={`app-${app.id}`}>{app.name}</Chip>
          ))}
          {hiddenCount > 0 && (
            <ExpandChip type="button" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? 'Rodyti mažiau' : `+ ${hiddenCount} daugiau`}
              <ChevronDown $up={expanded} />
            </ExpandChip>
          )}
        </ChipRow>
      )}
    </Row>
  );
};

export default SubscriptionRow;

const Row = styled.div<{ $inactive?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 0 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[400]};

  &:last-of-type {
    border-bottom: none;
  }

  ${rowHoverTint('8px')};

  /* The phone frame turns the row into a full-bleed card: it escapes the page
     gutter and gains 16px of padding, but it is still divided by a single rule
     rather than boxed in on every side. */
  @media ${device.mobileL} {
    margin: 0 -16px;
    padding: 16px;

    &::before {
      content: none;
    }
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
    gap: 22px;
  }
`;

const LeftSide = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
`;

const RightSide = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  flex-shrink: 0;
`;

const SwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const Name = styled.div<{ $inactive?: boolean }>`
  ${font('2xl')};
  color: ${({ theme }) => theme.colors.grey[700]};
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: ${({ $inactive }) => ($inactive ? 0.5 : 1)};
  transition: opacity 0.2s;
`;

const AutoBadge = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.grey[600]};
  flex-shrink: 0;
`;

const AutoLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const AutoText = styled.span`
  ${font('sm')};
`;

const Count = styled.div<{ $inactive?: boolean }>`
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-left: auto;
  opacity: ${({ $inactive }) => ($inactive ? 0.5 : 1)};
  transition: opacity 0.2s;
`;

const CountAllTime = styled.div`
  font-size: 1.8rem;
  line-height: 2.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
`;

const CountNew = styled.div`
  ${font('sm')};
  color: #1b4c28;
  white-space: nowrap;
`;

const ChevronButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};

  @media ${device.mobileL} {
    display: none;
  }
`;

const ChipRow = styled.div<{ $inactive?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  opacity: ${({ $inactive }) => ($inactive ? 0.5 : 1)};
  transition: opacity 0.2s;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const chipStyle = css`
  padding: 8px 12px;
  border-radius: 128px;
  /* Inset ring, not a border: the design's 37px pill is padding + line box. */
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.grey[300]};
  background: ${({ theme }) => theme.colors.white};
  ${font('sm')};
  color: ${({ theme }) => theme.colors.grey[700]};
  white-space: nowrap;
`;

const Chip = styled.div`
  ${chipStyle};
`;

const ExpandChip = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  ${chipStyle};
  cursor: pointer;
`;
