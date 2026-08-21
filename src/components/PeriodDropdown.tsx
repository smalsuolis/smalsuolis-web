import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { font } from '../styles';
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
        <Menu>
          {options.map((o) => (
            <Item
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
        </Menu>
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
  padding: 12px 20px;
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

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  /* Grows past the trigger so rows stay on one line. */
  min-width: 100%;
  width: max-content;
  max-width: 320px;
  z-index: 30;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid #ededed;
  border-radius: 4px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
  max-height: 320px;
  overflow-y: auto;
`;

const Item = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  text-align: left;
  padding: 8px 16px;
  margin: 4px 0;
  white-space: nowrap;
  cursor: pointer;
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ $active }) => ($active ? '#fafafa' : 'transparent')};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  }

  &:hover {
    background: #fafafa;
  }
`;
