import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { device, font } from '../../styles';
import api from '../../utils/api';
import { slugs } from '../../utils';
import { timeRangeQuery, TimeRanges } from '../../utils/types';

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
            <ChipMain>
              <IconCircle $bg={chip.bg}>
                {/* Height-constrained, auto width: the icons aren't all square
                    (the žuvinimas one is 10×13), so forcing 16×16 would stretch
                    them. */}
                <ChipIcon src={chip.icon} alt="" />
              </IconCircle>
              <ChipLabel>{chip.label}</ChipLabel>
            </ChipMain>
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
  gap: 16px;
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  /* Inset ring, not a border: the design's 43px pill is padding + content, and
     a border would add its width on top. */
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.grey[300]};
  border: none;
  border-radius: 39px;
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.grey[500]};
  }
`;

const ChipMain = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const IconCircle = styled.span<{ $bg: string }>`
  width: 24px;
  height: 24px;
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

const ChipLabel = styled.span`
  ${font('lg')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Count = styled.span`
  ${font('lg')};
  color: ${({ theme }) => theme.colors.grey[600]};
`;
