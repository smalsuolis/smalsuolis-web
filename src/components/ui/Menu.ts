import styled from 'styled-components';
import { font } from '../../styles';

// The design has one dropdown, used by the address suggestions, the Sritys and
// period pickers and the profile menu: a 4px-radius #EDEDED box whose rows are
// 40px tall inside 4px sections — 48 in total — separated by #DDDDDD hairlines
// and tinted #FAFAFA when hovered or selected.
export const Menu = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid #ededed;
  border-radius: 4px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden auto;
`;

export const MenuItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  /* 8/16 around a 24px row, plus the section's own 4px above and below. */
  padding: 12px 16px;
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  background: ${({ $active }) => ($active ? '#fafafa' : 'transparent')};

  &:hover {
    background: #fafafa;
  }

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  }
`;
