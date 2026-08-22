import styled from 'styled-components';
import { font } from '../../styles';

// Every statistics card is the same box in the design — a 9px-radius #BCBCBC
// outline, 16px of padding, 24px between its blocks — and every list inside one
// is the same 14px row separated by a #DDDDDD hairline.
export const Card = styled.div`
  /* Shrink inside the grid track rather than widening the page. */
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.grey[500]};
  border-radius: 9px;
  background: ${({ theme }) => theme.colors.white};
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
`;

export const CardHeading = styled.div`
  font-size: 1.8rem;
  line-height: 2.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const IconCircle = styled.span<{ $bg: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const CircleIcon = styled.img`
  width: 16px;
  height: 16px;
  display: block;
`;

export const RowList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 8px;
`;

// 12px of air, the hairline, then 12px again — the design's row spacing.
export const StatRow = styled.div`
  display: grid;
  align-items: center;
  gap: 12px;
  ${font('sm')};
  color: ${({ theme }) => theme.colors.text.primary};

  & + & {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  }
`;

export const RowLabel = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RowValues = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  white-space: nowrap;
`;

export const MoreButton = styled.button`
  align-self: flex-start;
  padding: 0;
  background: transparent;
  ${font('sm')};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: underline;
  cursor: pointer;
`;
