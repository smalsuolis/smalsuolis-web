import { useState } from 'react';
import styled from 'styled-components';
import Icon from '../Icons';
import { IconName } from '../../utils';
import Delta from './Delta';

export interface BreakdownRow {
  label: string;
  count: number;
  previousCount?: number;
  total: number; // denominator for the % column (parent total)
}

// One card in the "Suskirstymas pagal tipą" grid: an icon chip + title + total,
// then a list of rows each showing share-of-total %, the count, and an optional
// comparison delta. Collapses to `initialVisible` rows behind a Rodyti daugiau
// toggle when there are more.
const BreakdownCard = ({
  icon,
  title,
  total,
  rows,
  showComparison,
  isFetching,
  initialVisible = 5,
}: {
  icon: IconName;
  title: string;
  total: number;
  rows: BreakdownRow[];
  showComparison?: boolean;
  isFetching?: boolean;
  initialVisible?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, initialVisible);

  return (
    <Card>
      <Header>
        <TitleGroup>
          <IconChip>
            <ChipIcon name={icon} />
          </IconChip>
          <Title>{title}</Title>
        </TitleGroup>
        <Total>{total.toLocaleString('lt-LT')}</Total>
      </Header>

      <Rows>
        {visible.map((r) => {
          const pct = r.total > 0 ? (r.count * 100) / r.total : 0;
          return (
            <Row key={r.label}>
              <RowLabel>{r.label}</RowLabel>
              <Percent>{pct.toFixed(1)}%</Percent>
              <Count>{r.count.toLocaleString('lt-LT')}</Count>
              <DeltaCell>
                {showComparison && (
                  <Delta current={r.count} previous={r.previousCount} isFetching={isFetching} />
                )}
              </DeltaCell>
            </Row>
          );
        })}
      </Rows>

      {rows.length > initialVisible && (
        <MoreButton onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Rodyti mažiau' : 'Rodyti daugiau'}
        </MoreButton>
      )}
    </Card>
  );
};

export default BreakdownCard;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const IconChip = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;

  /* Some icons (forest, fishThin) hardcode width/height on their <svg> and
     ignore className, so constrain any child svg to the chip's icon size. */
  & > svg {
    width: 18px;
    height: 18px;
  }
`;

const ChipIcon = styled(Icon)`
  width: 18px;
  height: 18px;
  color: ${({ theme }) => theme.colors.tertiary};
`;

const Title = styled.div`
  font-size: 1.6rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Total = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text?.primary};
  white-space: nowrap;
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 10px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  }
`;

const RowLabel = styled.div`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.text?.primary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Percent = styled.div`
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  white-space: nowrap;
  text-align: right;
`;

const Count = styled.div`
  font-size: 1.4rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text?.primary};
  white-space: nowrap;
  text-align: right;
  min-width: 48px;
`;

const DeltaCell = styled.div`
  min-width: 40px;
  text-align: right;
`;

const MoreButton = styled.button`
  align-self: flex-start;
  margin-top: 12px;
  padding: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.tertiary};
  cursor: pointer;
  text-decoration: underline;
`;
