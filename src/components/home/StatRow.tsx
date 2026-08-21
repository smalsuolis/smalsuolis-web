import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { device, font } from '../../styles';
import api from '../../utils/api';
import { timeRangeQuery, TimeRanges } from '../../utils/types';

// Big four-up counter row. Reuses the same /stats endpoint the Stats page uses.
// We query the canonical ALL_TIME window (identical object, so it shares the
// server's stats cache key with the Stats page — whichever page loads first
// warms it for both). The query is also prefetched at app startup (UserProvider)
// so it's usually cached before this renders.
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
          {/* Reserve the number's height (nbsp) until it arrives — no em-dash
              placeholder, no layout shift. */}
          <Number>{item.count === undefined ? ' ' : item.count.toLocaleString('lt-LT')}</Number>
          <Label>{item.label}</Label>
        </Item>
      ))}
    </Grid>
  );
};

export default StatRow;

const Grid = styled.div`
  display: flex;
  gap: 112px;

  @media ${device.mobileL} {
    flex-direction: column;
    gap: 24px;
  }
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
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

const Label = styled.div`
  ${font('xl')};
  color: ${({ theme }) => theme.colors.text.primary};
`;
