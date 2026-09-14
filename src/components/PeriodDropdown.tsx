import { Fragment, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { fieldStates, font } from '../styles';
import { Menu, MenuItem } from './ui/Menu';
import { IconName } from '../utils';
import {
  displayCustomDateFilterLabel,
  formatDateAndTime,
  formatDateFrom,
  formatDateTo,
} from '../utils/functions';
import { TimeRanges } from '../utils/types';
import Icon from './Icons';
import DateRangePickerModal from './DateRangePickerModal';

export interface PeriodOption {
  key: string;
  name: string;
  query: { $gte: string; $lt: string };
}

// The one time-range control: the map, the events feed and the statistics page
// all use it, so "Pasirinkite datą" behaves the same in each.
const PeriodDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Pasirinkite',
  selectedDates,
}: {
  options: PeriodOption[];
  value: string;
  onChange: (option: PeriodOption) => void;
  // Shown when nothing is selected. The events filters pass a meaningful
  // label ("Sritys", "Data") rather than a generic prompt.
  placeholder?: string;
  // The range behind a CUSTOM selection, so the trigger can name it and the
  // picker can open on it.
  selectedDates?: { $gte: string; $lt: string };
}) => {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [range, setRange] = useState({ start: new Date(), end: new Date() });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDates?.$gte) {
      setRange({ start: new Date(selectedDates.$gte), end: new Date(selectedDates.$lt) });
    }
    // Seeds the picker from the incoming range on mount only — tracking it would
    // clobber a selection in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = options.find((o) => o.key === value);
  const label =
    value === TimeRanges.CUSTOM && selectedDates?.$gte
      ? displayCustomDateFilterLabel({
          start: new Date(selectedDates.$gte),
          end: new Date(selectedDates.$lt),
        })
      : current?.name ?? placeholder;

  const commitRange = (start: Date, end: Date) =>
    onChange({
      key: TimeRanges.CUSTOM,
      name: displayCustomDateFilterLabel({ start, end }),
      query: {
        $gte: formatDateAndTime(formatDateFrom(start)),
        $lt: formatDateAndTime(formatDateTo(end || start)),
      },
    });

  return (
    <Wrap ref={ref}>
      <Trigger type="button" onClick={() => setOpen((v) => !v)}>
        <Label>{label}</Label>
        <Chevron name={IconName.dropdownArrow} $open={open} />
      </Trigger>
      {open && (
        <Popover>
          {options.map((o, i) => {
            // The statistics list ends with per-year entries; the design sets
            // them off from the rolling ranges above.
            const startsYears = /^\d{4}$/.test(o.key) && !/^\d{4}$/.test(options[i - 1]?.key ?? '');
            return (
              <Fragment key={o.key}>
                {startsYears && <Divider />}
                <Item
                  as="button"
                  type="button"
                  $active={o.key === value}
                  onClick={() => {
                    setOpen(false);
                    if (o.key === TimeRanges.CUSTOM) setPickerOpen(true);
                    else onChange(o);
                  }}
                >
                  {o.name}
                </Item>
              </Fragment>
            );
          })}
        </Popover>
      )}
      {pickerOpen && (
        <DateRangePickerModal
          startDate={range.start}
          endDate={range.end}
          onDateChange={(val) => val && setRange({ start: val.start, end: val.end })}
          setOpen={(val) => {
            commitRange(range.start, range.end);
            setPickerOpen(val);
          }}
        />
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
  ${fieldStates};
`;

const Label = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Every dropdown arrow in the design is black; this one was the odd grey out.
const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.6rem;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.text.primary};
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

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.grey[300]};
`;

const Item = styled(MenuItem)`
  width: 100%;
  text-align: left;
  white-space: nowrap;
`;
