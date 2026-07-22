import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { font } from '../../styles';
import { App, IconName } from '../../utils';
import api from '../../utils/api';
import Icon from '../Icons';

interface Props {
  // Selected app ids.
  value: number[];
  onChange: (ids: number[]) => void;
}

// "Sritys" = the integration/event types (apps). Multi-select dropdown backed by
// the existing api.getAllApps() endpoint (same data the events filter uses).
const SritysSelect = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: apps = [] } = useQuery({
    queryKey: ['apps', 'all'],
    queryFn: () => api.getAllApps(),
    staleTime: Infinity,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const label =
    value.length === 0
      ? 'Sritys'
      : value.length === 1
        ? apps.find((a: App) => a.id === value[0])?.name ?? 'Sritys'
        : `Sritys (${value.length})`;

  return (
    <Wrap ref={wrapRef}>
      <Control type="button" onClick={() => setOpen((o) => !o)} $placeholder={value.length === 0}>
        <span>{label}</span>
        <Chevron name={IconName.dropdownArrow} $open={open} />
      </Control>

      {open && (
        <Dropdown>
          {apps.map((app: App) => (
            <Option
              key={app.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggle(app.id)}
            >
              <Checkbox $checked={value.includes(app.id)}>
                {value.includes(app.id) && <Icon name={IconName.check} />}
              </Checkbox>
              {app.name}
            </Option>
          ))}
        </Dropdown>
      )}
    </Wrap>
  );
};

export default SritysSelect;

const Wrap = styled.div`
  position: relative;
`;

const Control = styled.button<{ $placeholder: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  width: 100%;
  min-width: 200px;
  min-height: 56px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.grey[500]};
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  ${font('lg')};
  color: ${({ $placeholder, theme }) =>
    $placeholder ? theme.colors.grey[500] : theme.colors.text.primary};
`;

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.6rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  padding: 8px;
  z-index: 50;
  min-width: 240px;
`;

const Option = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  ${font('base')};
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};

  &:hover {
    background: ${({ theme }) => theme.colors.grey[300]};
  }
`;

const Checkbox = styled.span<{ $checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1px solid
    ${({ $checked, theme }) => ($checked ? theme.colors.primary : theme.colors.grey[500])};
  background: ${({ $checked, theme }) => ($checked ? theme.colors.primary : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;
