import { useEffect, useRef, useState } from 'react';
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
  // Clicking an ellipsis turns it into a number input, so a distant page is
  // reachable without stepping through the range.
  const [jumpAt, setJumpAt] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (jumpAt !== null) inputRef.current?.focus();
  }, [jumpAt]);

  const commitJump = () => {
    const n = Number(draft);
    if (n >= 1 && n <= totalPages) onChange(n);
    setJumpAt(null);
    setDraft('');
  };

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
          jumpAt === i ? (
            <JumpInput
              key={`gap-${i}`}
              ref={inputRef}
              type="number"
              min={1}
              max={totalPages}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitJump}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitJump();
                if (e.key === 'Escape') {
                  setJumpAt(null);
                  setDraft('');
                }
              }}
              aria-label={`Įveskite puslapio numerį (1–${totalPages})`}
            />
          ) : (
            <Gap
              key={`gap-${i}`}
              type="button"
              onClick={() => setJumpAt(i)}
              title={`Pereiti į puslapį (1–${totalPages})`}
              aria-label="Pereiti į puslapį"
            >
              …
            </Gap>
          )
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

const Gap = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 44px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};
  ${font('base', 500)};

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }

  @media ${device.mobileL} {
    height: 38px;
    min-width: 28px;
  }
`;

// Replaces the ellipsis in place, so the row's height and rhythm don't shift.
const JumpInput = styled.input`
  width: 64px;
  height: 44px;
  padding: 0 8px;
  text-align: center;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text.primary};
  ${font('base', 500)};
  outline: none;

  /* Hide the spinners — the arrows are redundant next to the pager itself. */
  appearance: textfield;
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  @media ${device.mobileL} {
    width: 56px;
    height: 38px;
  }
`;
