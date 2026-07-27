import styled from 'styled-components';
import Delta from './Delta';

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
    <CityName>{city}</CityName>
    <Rows>
      {rows.map((r) => {
        const pct = r.total > 0 ? (r.count * 100) / r.total : 0;
        return (
          <Row key={r.label}>
            <Dot $color={r.color} />
            <Label>{r.label}</Label>
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
  </Card>
);

export default CityCard;

const Card = styled.div`
  /* Shrink inside the grid track rather than widening the page. */
  min-width: 0;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 16px;
  padding: 24px;
`;

const CityName = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text?.primary};
  margin-bottom: 12px;
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 10px;
  padding: 9px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  }
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Label = styled.div`
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
  min-width: 44px;
`;

const DeltaCell = styled.div`
  min-width: 38px;
  text-align: right;
`;
