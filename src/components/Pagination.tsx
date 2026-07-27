import styled from 'styled-components';
import { device, font } from '../styles';

// Numbered pagination: « ‹ 1 2 3 … 10 › ». Replaces infinite scroll on the
// events list so a given page is linkable and reachable directly.

const FirstIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m18 6-6 6 6 6M12 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PrevIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m15 6-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Window of page numbers around the current page, with ellipses where the
// sequence jumps. Always keeps the first and last page reachable.
const buildPages = (current: number, total: number): (number | 'gap')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('gap');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('gap');
  pages.push(total);

  return pages;
};

const Pagination = ({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped !== page) onChange(clamped);
  };

  return (
    <Nav role="navigation" aria-label="Puslapiavimas">
      <Cell type="button" onClick={() => go(1)} disabled={page === 1} aria-label="Pirmas puslapis">
        <FirstIcon />
      </Cell>
      <Cell
        type="button"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Ankstesnis puslapis"
      >
        <PrevIcon />
      </Cell>

      {buildPages(page, totalPages).map((item, i) =>
        item === 'gap' ? (
          <Gap key={`gap-${i}`}>…</Gap>
        ) : (
          <Cell
            key={item}
            type="button"
            $active={item === page}
            onClick={() => go(item)}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`${item} puslapis`}
          >
            {item}
          </Cell>
        ),
      )}

      <Cell
        type="button"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        aria-label="Kitas puslapis"
      >
        <Flip>
          <PrevIcon />
        </Flip>
      </Cell>
      <Cell
        type="button"
        onClick={() => go(totalPages)}
        disabled={page === totalPages}
        aria-label="Paskutinis puslapis"
      >
        <Flip>
          <FirstIcon />
        </Flip>
      </Cell>
    </Nav>
  );
};

export default Pagination;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 32px 0 8px;

  @media ${device.mobileL} {
    gap: 6px;
  }
`;

const Cell = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  padding: 0 8px;
  border-radius: 8px;
  cursor: pointer;
  ${font('base', 500)};
  border: 1px solid ${({ $active, theme }) => ($active ? 'transparent' : theme.colors.grey[300])};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.white)};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.text.primary)};
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:not(:disabled):hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.background};
  }

  @media ${device.mobileL} {
    min-width: 38px;
    height: 38px;
  }
`;

const Flip = styled.span`
  display: inline-flex;
  transform: rotate(180deg);
`;

const Gap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 44px;
  color: ${({ theme }) => theme.colors.text.primary};
  ${font('base', 500)};
`;
