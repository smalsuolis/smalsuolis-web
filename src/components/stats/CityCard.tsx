import styled from 'styled-components';
import Delta from './Delta';
import {
  Card,
  CardHeader,
  CardHeading,
  RowCount,
  RowLabel,
  RowList,
  RowValues,
  StatRow,
} from './cardStyles';

export interface CityRow {
  label: string;
  color: string;
  count: number;
  previousCount?: number;
  total: number; // city total, denominator for the % column
}

// One "Akyviausi miestai" card: a city name and a per-appType list, each row a
// colored dot + label + share-of-city % + count + optional delta.
const CityCard = ({
  city,
  rows,
  showComparison,
  isFetching,
}: {
  city: string;
  rows: CityRow[];
  showComparison?: boolean;
  isFetching?: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardHeading>{city}</CardHeading>
    </CardHeader>
    <RowList>
      {rows.map((r) => {
        const pct = r.total > 0 ? (r.count * 100) / r.total : 0;
        return (
          <Row key={r.label}>
            <Dot $color={r.color} />
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
  </Card>
);

export default CityCard;

// The frame leaves 4px between the dot and its label, not the row's 12.
const Row = styled(StatRow)`
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 4px;

  ${RowValues} {
    margin-left: 8px;
  }
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Percent = styled.span`
  color: ${({ theme }) => theme.colors.grey[500]};
  text-align: right;
`;
