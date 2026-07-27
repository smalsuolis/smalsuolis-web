import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { font } from '../../styles';
import { AddressSuggestion, IconName, useRecentAddresses } from '../../utils';
import api from '../../utils/api';
import Icon from '../Icons';

interface Props {
  value: string;
  onChange: (text: string) => void;
  // Fired when the user picks a suggestion (or clears). Carries the geometry so
  // callers can center a map on the resolved point.
  onSelect: (suggestion: AddressSuggestion | null) => void;
  placeholder?: string;
  onSubmit?: () => void;
}

// Debounced address search with a suggestion dropdown. Queries the API's
// /addresses/suggest endpoint (boundaries registry). Presentational shell only —
// callers wrap it in their own field styling.
const AddressAutocomplete = ({ value, onChange, onSelect, placeholder, onSubmit }: Props) => {
  const [debounced, setDebounced] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { recents, add: addRecent, remove: removeRecent } = useRecentAddresses();

  // Show the recent-searches list when the field is focused with no query yet.
  const showRecents = open && debounced.length < 3 && recents.length > 0;

  // Debounce the query term (300ms, matching the events feed search).
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 300);
    return () => clearTimeout(t);
  }, [value]);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ['address-suggest', debounced],
    queryFn: () => api.suggestAddresses(debounced),
    enabled: debounced.length >= 3,
    staleTime: 5 * 60 * 1000,
  });

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (s: AddressSuggestion) => {
    onChange(s.label);
    onSelect(s);
    addRecent(s);
    setOpen(false);
    setHighlight(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') onSubmit?.();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0) pick(suggestions[highlight]);
      else onSubmit?.();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Wrap ref={wrapRef}>
      <InputRow>
        <SearchIcon name={IconName.search} />
        <Input
          placeholder={placeholder ?? 'Įveskite dominantį adresą'}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onSelect(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </InputRow>

      {open && debounced.length >= 3 && (
        <Dropdown>
          {isFetching && suggestions.length === 0 && <Empty>Ieškoma…</Empty>}
          {!isFetching && suggestions.length === 0 && <Empty>Nieko nerasta</Empty>}
          {suggestions.map((s, i) => (
            <Option
              key={s.code}
              $active={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
            >
              {s.label}
            </Option>
          ))}
        </Dropdown>
      )}

      {showRecents && (
        <Dropdown>
          <RecentsHeader>Neseniai ieškota</RecentsHeader>
          {/* Scrollable: all recents (up to 10) live here, but only ~4 show at
              once (RecentsList max-height) so the dropdown stays compact. */}
          <RecentsList>
            {recents.map((r) => (
              <RecentRow key={r.label}>
                <RecentLabel
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(r);
                  }}
                >
                  <RecentIcon name={IconName.time} />
                  <span>{r.label}</span>
                </RecentLabel>
                <RemoveButton
                  aria-label="Pašalinti"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeRecent(r.label);
                  }}
                >
                  <Icon name={IconName.close} />
                </RemoveButton>
              </RecentRow>
            ))}
          </RecentsList>
        </Dropdown>
      )}
    </Wrap>
  );
};

export default AddressAutocomplete;

const Wrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchIcon = styled(Icon)`
  font-size: 2.4rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  flex-shrink: 0;
`;

const Input = styled.input`
  border: none;
  outline: none;
  width: 100%;
  background: transparent;
  ${font('lg')};
  color: ${({ theme }) => theme.colors.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.grey[500]};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  padding: 8px;
  z-index: 50;
  max-height: 320px;
  overflow-y: auto;
`;

const Option = styled.div<{ $active: boolean }>`
  ${font('base')};
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ $active, theme }) => ($active ? theme.colors.grey[300] : 'transparent')};
`;

const Empty = styled.div`
  ${font('base')};
  padding: 12px 14px;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const RecentsHeader = styled.div`
  ${font('base', 600)};
  font-size: 1.3rem;
  padding: 8px 14px 4px;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

// ~4 rows visible at once (each ≈ 44px); the rest scroll.
const RecentsList = styled.div`
  max-height: 180px;
  overflow-y: auto;
`;

const RecentRow = styled.div`
  display: flex;
  align-items: center;
  border-radius: 10px;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const RecentLabel = styled.div`
  ${font('base')};
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 4px 11px 14px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const RecentIcon = styled(Icon)`
  font-size: 1.6rem;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.grey[500]};
`;

const RemoveButton = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 6px;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.grey[500]};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.grey[300]};
  }

  svg {
    font-size: 1.5rem;
  }
`;
