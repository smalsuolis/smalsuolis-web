import { Fragment, useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import styled from 'styled-components';
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
                  <SelectedDateLabel
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
                  </SelectedDateLabel>
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

const FilterContainer = styled.div`
  position: absolute;
  z-index: 8;
  padding: 32px;
  gap: 24px;
  background-color: white;
  top: 10px;
  border-radius: 16px;
  box-shadow: 0px 18px 41px #121a5529;
  display: flex;
  flex-direction: column;
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
  /* The design's 184px holds its sample label; real range names are longer, so
     grow rather than truncate the current selection. */
  min-width: 184px;
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
  background-color: #e5e7eb;
  margin: 4px 0;
`;

const SelectedDateLabel = styled.div`
  color: ${({ theme }) => theme.colors.text?.primary};
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: -0.02em;
  white-space: nowrap;
  &:hover,
  &:focus {
    cursor: pointer;
  }
`;

export default Datepicker;
