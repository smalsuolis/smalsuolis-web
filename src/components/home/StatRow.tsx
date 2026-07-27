import { useQuery } from '@tanstack/react-query';
import styled, { keyframes } from 'styled-components';
import { device, font } from '../../styles';
import api from '../../utils/api';
import { timeRangeQuery, TimeRanges } from '../../utils/types';

// Big four-up counter row. Reuses the same /stats endpoint the Stats page uses.
// We query the canonical ALL_TIME window (identical object, so it shares the
// server's stats cache key with the Stats page — whichever page loads first
// warms it for both). The query is also prefetched at app startup (UserProvider)
// so it's usually cached before this renders; on a cold direct-load the number
// fades in softly rather than popping from a placeholder.
const ALL_TIME = timeRangeQuery[TimeRanges.ALL_TIME];

const StatRow = () => {
  const { data } = useQuery({
    queryKey: ['home-stats', ALL_TIME],
    queryFn: () => api.getStats(ALL_TIME),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const items = [
    { label: 'Įvykių', count: data?.count },
    { label: 'Kirtimų leidimų', count: data?.byApp?.miskoKirtimai?.count },
    { label: 'Statybos leidimų', count: data?.byApp?.infostatyba?.count },
    { label: 'Žemėtvarkos planavimų', count: data?.byApp?.zemetvarkosPlanavimas?.count },
  ];

  return (
    <Grid>
      {items.map((item) => (
        <Item key={item.label}>
          {/* Reserve the number's height (nbsp) until it arrives, then fade it in
              once — no em-dash placeholder, no layout shift. */}
          <Number>
            {item.count === undefined ? (
              ' '
            ) : (
              <FadeNumber>{item.count.toLocaleString('lt-LT')}</FadeNumber>
            )}
          </Number>
          <Label>{item.label}</Label>
        </Item>
      ))}
    </Grid>
  );
};

export default StatRow;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;

  @media ${device.mobileL} {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px 16px;
  }
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Number = styled.div`
  ${font('5xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  min-height: 1.2em;

  @media ${device.mobileL} {
    ${font('3xl')};
    font-weight: 400;
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const FadeNumber = styled.span`
  display: inline-block;
  animation: ${fadeIn} 0.25s ease-out;
`;

const Label = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};
`;
