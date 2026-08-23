import { useState } from 'react';
import styled from 'styled-components';
import Delta from './Delta';
import {
  Card,
  CardHeader,
  CardTotal,
  CardHeading,
  CircleIcon,
  IconCircle,
  MoreButton,
  RowCount,
  RowLabel,
  RowList,
  RowValues,
  StatRow,
} from './cardStyles';

export interface BreakdownRow {
  label: string;
  count: number;
  previousCount?: number;
  total: number; // denominator for the % column (parent total)
}

// One card in the "Suskirstymas pagal tipą" grid: an icon circle + title +
// total, then rows showing share-of-total %, the count, and an optional
// comparison delta. Collapses to `initialVisible` rows behind a Rodyti daugiau
// toggle when there are more.
const BreakdownCard = ({
  icon,
  iconBg,
  title,
  total,
  rows,
  showComparison,
  isFetching,
  initialVisible = 5,
}: {
  icon: string;
  iconBg: string;
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
      <CardHeader>
        <TitleGroup>
          <IconCircle $bg={iconBg}>
            <CircleIcon src={icon} alt="" />
          </IconCircle>
          <CardHeading>{title}</CardHeading>
        </TitleGroup>
        <CardTotal as="div">{total.toLocaleString('lt-LT')}</CardTotal>
      </CardHeader>

      <RowList>
        {rows.length === 0 && <EmptyRow>Šiuo laikotarpiu įvykių nėra</EmptyRow>}
        {visible.map((r) => {
          const pct = r.total > 0 ? (r.count * 100) / r.total : 0;
          return (
            <Row key={r.label}>
              <RowLabel>{r.label}</RowLabel>
              <RowValues>
                <Percent>{pct.toFixed(1)}%</Percent>
                <RowCount>
                  {r.count.toLocaleString('lt-LT')}
                  {showComparison && (
                    <Delta current={r.count} previous={r.previousCount} isFetching={isFetching} />
                  )}
                </RowCount>
              </RowValues>
            </Row>
          );
        })}
      </RowList>

      {rows.length > initialVisible && (
        <MoreButton onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Rodyti mažiau' : 'Rodyti daugiau'}
        </MoreButton>
      )}
    </Card>
  );
};

export default BreakdownCard;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const Row = styled(StatRow)`
  grid-template-columns: minmax(0, 1fr) auto;
`;

// Shown instead of the rows when a card has no data for the selected period —
// the card still renders so the page keeps a stable shape and the zero total
// stays visible.
const EmptyRow = styled.div`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const Percent = styled.span`
  color: ${({ theme }) => theme.colors.grey[500]};
  text-align: right;
`;
