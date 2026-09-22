import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Menu, MenuItem } from '../ui/Menu';
import { font } from '../../styles';
import { AddressSuggestion, IconName, useRecentAddresses } from '../../utils';
import { formatCoordinate, parseCoordinate } from '../../utils/coordinates';
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

  // A coordinate pair is a place the registry cannot be asked about, so it is
  // resolved here and the address lookup is skipped entirely — otherwise every
  // keystroke of "54.6872, 25.2797" is a search for a street by that name.
  const coordinate = useMemo(() => parseCoordinate(debounced), [debounced]);

  const {
    data: addressSuggestions = [],
    isFetching,
    isPlaceholderData,
  } = useQuery({
    queryKey: ['address-suggest', debounced],
    queryFn: ({ signal }) => api.suggestAddresses(debounced, signal),
    enabled: debounced.length >= 3 && !coordinate,
    staleTime: 5 * 60 * 1000,
    // Every debounce tick is a new key, so without this the list emptied and the
    // dropdown fell back to "Ieškoma…" between each pause in typing — half the
    // search read as waiting even when the registry answered in half a second.
    placeholderData: keepPreviousData,
  });

  const suggestions: AddressSuggestion[] = useMemo(
    () =>
      coordinate
        ? [
            {
              code: 0,
              label: formatCoordinate(coordinate),
              geometry: { type: 'Point', coordinates: [coordinate.lng, coordinate.lat] },
            },
          ]
        : addressSuggestions,
    [coordinate, addressSuggestions],
  );

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
      // The list can refresh under the highlight — arrowing to row 8 of
      // "Gedimino" and then narrowing to "Gedimino pr. 9" leaves the index past
      // the end — so an Enter with nothing under it searches instead of throwing.
      const highlighted = highlight >= 0 ? suggestions[highlight] : undefined;
      if (highlighted) pick(highlighted);
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
        /* Dimmed while the list on screen belongs to the previous query: kept
           legible (0.55 of black on the panel's white is still AA), but visibly
           not final. */
        <Dropdown $stale={isPlaceholderData}>
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
              {coordinate && <System>{coordinate.system === 'LKS94' ? 'LKS-94' : 'WGS84'}</System>}
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

// Design: a 16px black glyph, not a 24px grey one.
const SearchIcon = styled(Icon)`
  width: 16px;
  height: 16px;
  font-size: 1.6rem;
  color: ${({ theme }) => theme.colors.text.primary};
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
    /* grey[600], not grey[500]: #BCBCBC on white is 1.9:1, under half the 4.5:1
       WCAG AA asks of text, and it read as an empty field rather than a hint. */
    color: ${({ theme }) => theme.colors.grey[600]};
  }
`;

const Dropdown = styled(Menu)<{ $stale?: boolean }>`
  /* The rows fade, never the panel: on the map this sits over tiles, and fading
     the container let them show through the list. */
  & > * {
    opacity: ${({ $stale }) => ($stale ? 0.55 : 1)};
    transition: opacity 0.12s ease;
  }

  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 320px;
`;

const Option = MenuItem;

// Names the system the pair was read as. Both orders are accepted, so without
// this the only way to tell a misread apart from a mistyped coordinate is to
// look at where the pin landed.
const System = styled.span`
  ${font('sm')};
  margin-left: 8px;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const Empty = styled.div`
  ${font('base')};
  padding: 12px 16px;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const RecentsHeader = styled.div`
  ${font('sm')};
  padding: 12px 16px 4px;
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

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  }

  &:hover {
    background: #fafafa;
  }
`;

const RecentLabel = styled.div`
  ${font('base')};
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 4px 12px 16px;
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
