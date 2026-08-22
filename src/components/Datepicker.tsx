import { Fragment, useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import styled from 'styled-components';
import { Menu, MenuItem } from './ui/Menu';
import Icon from './Icons';
import {
  Frequency,
  IconName,
  displayCustomDateFilterLabel,
  formatDateAndTime,
  formatDateFrom,
  formatDateTo,
  statsTimeRangeItems,
} from '../utils';
import { TimeRanges } from '../utils/types';
import DateRangePickerModal from './DateRangePickerModal';

const frequencyLabels: Record<string, string> = {
  [Frequency.DAY]: 'Šiandienos',
  [Frequency.WEEK]: 'Savaitės',
  [Frequency.MONTH]: 'Mėnesio',
  [Frequency.CUSTOM]: 'Pasirinkite datą',
  [TimeRanges.LAST_7_DAYS]: 'Paskutinės 7 dienos',
  [TimeRanges.LAST_28_DAYS]: 'Paskutinės 28 dienos',
  [TimeRanges.LAST_90_DAYS]: 'Paskutinės 90 dienų',
  [TimeRanges.LAST_365_DAYS]: 'Paskutinės 365 dienos',
  [TimeRanges.ALL_TIME]: 'Visi laikai',
};

export interface DatepickerProps {
  value: string;
  onChange: (val1: string, val2: { $gte: string; $lt: string }) => void;
  selectedDates: {
    $gte: string;
    $lt: string;
  };
}

const Datepicker = ({ value, onChange, selectedDates }: DatepickerProps) => {
  const [open, setOpen] = useState(false);
  const [openDatePickerModal, setOpenDatePickerModal] = useState(false);
  const [date, setDate] = useState({ start: new Date(), end: new Date() });

  const handleBlur = (event: any) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (selectedDates) {
      setDate({
        start: new Date(selectedDates.$gte),
        end: new Date(selectedDates.$lt),
      });
    }
    // Seeds the picker from the incoming range once, on mount only — adding
    // selectedDates here would clobber the user's in-progress selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container tabIndex={1} onBlur={handleBlur}>
      <FilterButton onClick={() => setOpen(!open)}>
        <SelectedDateLabel>
          {value === TimeRanges.CUSTOM
            ? displayCustomDateFilterLabel({
                start: new Date(selectedDates.$gte),
                end: new Date(selectedDates.$lt),
              })
            : frequencyLabels[value] || value}
        </SelectedDateLabel>
        <Icon name={IconName.dropdownArrow} />
      </FilterButton>

      {open ? (
        <DateContainer>
          <FilterContainer>
            {statsTimeRangeItems?.map((item, index) => {
              const isFirstYearItem =
                /^\d{4}$/.test(item.key) && !/^\d{4}$/.test(statsTimeRangeItems[index - 1]?.key);
              return (
                <Fragment key={item.key}>
                  {isFirstYearItem && <Divider />}
                  <MenuItem
                    $active={item.key === value}
                    onClick={() => {
                      if (item.key === TimeRanges.CUSTOM) {
                        setOpenDatePickerModal(true);
                        setOpen(false);
                      } else {
                        onChange(item.key, item.query);
                        if (item.query.$gte && item.query.$lt) {
                          setDate({
                            start: new Date(item.query.$gte),
                            end: new Date(item.query.$lt),
                          });
                        }
                        setOpen(false);
                      }
                    }}
                  >
                    {item.name}
                  </MenuItem>
                </Fragment>
              );
            })}
          </FilterContainer>
        </DateContainer>
      ) : null}
      {openDatePickerModal && (
        <DateRangePickerModal
          onDateChange={(val) => {
            val && setDate({ start: val.start, end: val.end });
          }}
          startDate={date.start}
          endDate={date.end}
          setOpen={(val) => {
            onChange(TimeRanges.CUSTOM, {
              $gte: formatDateAndTime(formatDateFrom(date.start)),
              $lt: formatDateAndTime(formatDateTo(date.end || date.start)),
            });
            setOpenDatePickerModal(val);
          }}
        />
      )}
    </Container>
  );
};

const DateContainer = styled.div`
  position: relative;
  &:focus {
    outline: none;
  }
`;

// The same menu the address suggestions and the other pickers use.
const FilterContainer = styled(Menu)`
  position: absolute;
  z-index: 8;
  top: 4px;
  min-width: 100%;
  width: max-content;
  max-height: 320px;
`;

const Container = styled.div`
  position: relative;
  &:focus {
    outline: none;
  }
`;

// Design: the same 184x40 outlined pill the events filters use.
const FilterButton = styled.div`
  display: flex;
  flex-direction: row;
  background-color: white;
  border: 1px solid #bcbcbc;
  border-radius: 54px;
  width: 184px;
  height: 40px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  gap: 12px;
  &:hover,
  &:focus {
    cursor: pointer;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.grey[300]};
`;

const SelectedDateLabel = styled.div`
  color: ${({ theme }) => theme.colors.text?.primary};
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: -0.02em;
  /* The design truncates the label rather than widening the control — its own
     mobile frame draws "Praeito mėn…". */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover,
  &:focus {
    cursor: pointer;
  }
`;

export default Datepicker;
