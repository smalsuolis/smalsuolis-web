import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { font } from '../styles';
import { Menu, MenuItem } from './ui/Menu';
import { IconName } from '../utils';
import Icon from './Icons';

export interface PeriodOption {
  key: string;
  name: string;
  query: { $gte: string; $lt: string };
}

// Compact pill dropdown for selecting a time range. Used as a floating control
// on the map page; options come from the shared statsTimeRangeItems.
const PeriodDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Pasirinkite',
}: {
  options: PeriodOption[];
  value: string;
  onChange: (option: PeriodOption) => void;
  // Shown when nothing is selected. The events filters pass a meaningful
  // label ("Sritys", "Data") rather than a generic prompt.
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = options.find((o) => o.key === value);

  return (
    <Wrap ref={ref}>
      <Trigger type="button" onClick={() => setOpen((v) => !v)}>
        <Label>{current?.name ?? placeholder}</Label>
        <Chevron name={IconName.dropdownArrow} $open={open} />
      </Trigger>
      {open && (
        <Popover>
          {options.map((o) => (
            <Item
              as="button"
              type="button"
              key={o.key}
              $active={o.key === value}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
            >
              {o.name}
            </Item>
          ))}
        </Popover>
      )}
    </Wrap>
  );
};

export default PeriodDropdown;

const Wrap = styled.div`
  position: relative;
`;

const Trigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.grey[500]};
  border-radius: 54px;
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Label = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.6rem;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.grey[600]};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'none')};
  transition: transform 0.15s ease;
`;

const Popover = styled(Menu)`
  position: absolute;
  top: calc(100% + 8px);
  /* Every trigger sits in the right-hand control slot, so the menu grows
     leftwards past it — anchored left it ran off a narrow viewport. */
  right: 0;
  min-width: 100%;
  width: max-content;
  max-width: min(320px, calc(100vw - 32px));
  max-height: 320px;
  z-index: 30;
`;

const Item = styled(MenuItem)`
  width: 100%;
  text-align: left;
  white-space: nowrap;
`;
