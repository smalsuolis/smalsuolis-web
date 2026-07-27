import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { device, font } from '../../styles';
import api from '../../utils/api';
import { slugs } from '../../utils';
import { timeRangeQuery, TimeRanges } from '../../utils/types';

// "Naršyk pagal paskirtį" — a horizontal strip of category pills, each with a
// colored icon, name, and an approximate count. Presentational browse entry
// point; clicking routes into the events feed (filter wiring lands with the
// events-page redesign).
// Shares the canonical ALL_TIME window (same object → same server cache key)
// with StatRow and the Stats page.
const ALL_TIME = timeRangeQuery[TimeRanges.ALL_TIME];

const compact = (n?: number) => {
  if (n === undefined) return '';
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `${n}`;
};

const CategoryBrowse = () => {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['home-stats', ALL_TIME],
    queryFn: () => api.getStats(ALL_TIME),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const chips = [
    {
      key: 'fish',
      label: 'Žuvinimas',
      icon: '/home/cat_fish.svg',
      count: data?.byApp?.izuvinimas?.count,
      bg: '#E8F1FF',
    },
    {
      key: 'map',
      label: 'Žemėtvarkos planavimas',
      icon: '/home/cat_map.svg',
      count: data?.byApp?.zemetvarkosPlanavimas?.count,
      bg: '#EDE9FE',
    },
    {
      key: 'building',
      label: 'Statiniai',
      icon: '/home/cat_building.svg',
      count: data?.byApp?.infostatyba?.count,
      bg: '#FDE8E8',
    },
    {
      key: 'autorenew',
      label: 'Žemės paskirties keitimas',
      icon: '/home/cat_autorenew.svg',
      count: data?.byApp?.savivaldybesZemetvarka?.count,
      bg: '#DFF7E6',
    },
    {
      key: 'forest',
      label: 'Miško kirtimai',
      icon: '/home/cat_forest.svg',
      count: data?.byApp?.miskoKirtimai?.count,
      bg: '#DFF7E6',
    },
  ];

  return (
    <Wrap>
      <Title>Naršyk pagal paskirtį</Title>
      <Chips>
        {chips.map((chip) => (
          <Chip key={chip.key} onClick={() => navigate(slugs.events)}>
            <IconCircle $bg={chip.bg}>
              {/* Height-constrained, auto width: the icons aren't all square
                  (the žuvinimas one is 10×13), so forcing 16×16 would stretch
                  them. */}
              <ChipIcon src={chip.icon} alt="" />
            </IconCircle>
            <ChipLabel>{chip.label}</ChipLabel>
            {chip.count !== undefined && <Count>{compact(chip.count)}</Count>}
          </Chip>
        ))}
      </Chips>
    </Wrap>
  );
};

export default CategoryBrowse;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

// DS section heading: Medium 30px, tight tracking. Node 116:1907.
const Title = styled.h2`
  ${font('3xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  text-align: center;
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 8px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.grey[500]};
  }
`;

const IconCircle = styled.span<{ $bg: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ChipIcon = styled.img`
  height: 16px;
  width: auto;
  max-width: 16px;
  display: block;
`;

// DS category chip: label Regular 18px black, count Regular 18px grey-600
// (#707070). Figma nodes 116:2779 / 116:2780.
const ChipLabel = styled.span`
  ${font('lg')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Count = styled.span`
  ${font('lg')};
  color: ${({ theme }) => theme.colors.grey[600]};
`;
