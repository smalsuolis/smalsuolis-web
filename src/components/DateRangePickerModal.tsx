import { lt } from 'date-fns/locale';
import Datepicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styled from 'styled-components';
import { device, useWindowSize } from '@aplinkosministerija/design-system';
import { font } from '../styles';
import Icon from './Icons';
import { IconName } from '../utils';

registerLocale('lt', lt);

export interface DateRangePickerProps {
  onDateChange: ({ start, end }) => void;
  endDate: Date;
  startDate: Date;
  setOpen: (val: boolean) => void;
}

const DateRangePickerModal = ({
  onDateChange,
  endDate,
  startDate,
  setOpen,
}: DateRangePickerProps) => {
  const isMobile = useWindowSize(device.mobileL);
  const handleBlur = (event: any) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false);
    }
  };

  return (
    <Container tabIndex={1} onBlur={handleBlur}>
      <DateContainer>
        <Datepicker
          locale="lt"
          selected={startDate}
          onChange={(dates) => {
            const [start, end] = dates;
            onDateChange({ start, end: end });
          }}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          onClickOutside={() => setOpen(false)}
          inline
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            decreaseYear,
            increaseYear,
          }) => (
            <CustomHeader>
              <YearNavButton onClick={decreaseYear} title="Ankstesni metai">
                ‹‹
              </YearNavButton>
              <MonthNavButton onClick={decreaseMonth}>‹</MonthNavButton>
              <MonthLabel>
                {date.toLocaleString('lt', { month: 'long', year: 'numeric' })}
              </MonthLabel>
              <MonthNavButton onClick={increaseMonth}>›</MonthNavButton>
              <YearNavButton onClick={increaseYear} title="Kiti metai">
                ››
              </YearNavButton>
              {isMobile && (
                <CloseButton type="button" aria-label="Uždaryti" onClick={() => setOpen(false)}>
                  <CloseIcon name={IconName.close} />
                </CloseButton>
              )}
            </CustomHeader>
          )}
        >
          <OkButtonContainer>
            <OkButton onClick={() => setOpen(false)}>Pasirinkti</OkButton>
          </OkButtonContainer>
        </Datepicker>
      </DateContainer>
    </Container>
  );
};

const DateContainer = styled.div`
  position: relative;
  &:focus {
    outline: none;
  }
  @media ${device.mobileL} {
    position: fixed;
    z-index: 9;
    left: 0px;
    top: 0px;
    width: 100vw;
    height: 100vh;
    overflow: auto;
    justify-content: center;
    align-items: center;
    background-color: rgba(11, 11, 11, 0.4);
  }
`;

const CloseButton = styled.button`
  display: flex;
  margin-left: 8px;
  padding: 0;
  background: transparent;
  cursor: pointer;
`;

const CloseIcon = styled(Icon)`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 2.4rem;
`;

const Container = styled.div`
  position: relative;
  &:focus {
    outline: none;
  }
  .react-datepicker__header {
    background-color: white !important;
    border: none;
  }
  .react-datepicker__day--outside-month {
    color: #151229;
    opacity: 0.6;
  }
  .react-datepicker__day {
    position: relative;
    z-index: 0;
    width: 44px;
    height: 44px;
    line-height: 44px;
    padding: 0;
    margin: auto;
    font-size: 1.5rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    &:hover {
      background-color: #fafafa !important;
    }
    @media ${device.mobileL} {
      width: 40px;
      height: 40px;
      line-height: 40px;
    }
  }
  .react-datepicker {
    position: absolute;
    top: 4px;
    /* The trigger sits at the right edge of the toolbar, so the panel hangs
       leftwards from it instead of running off the viewport. */
    right: 0;
    z-index: 8;
    background-color: #ffffff;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    padding: 0 24px 24px;
    border: 1px solid #ededed;

    /* On a phone it is a centred card, sized to the viewport rather than to a
       fixed 375 that overflowed the narrower ones. */
    @media ${device.mobileL} {
      width: calc(100vw - 32px);
      max-width: 361px;
      padding: 0 16px 24px;
      right: auto;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }
  .react-datepicker__day--keyboard-selected:focus {
    outline: none;
  }
  .react-datepicker__day-name {
    font-size: 1.4rem;
    color: ${({ theme }) => theme.colors.grey[600]};
    width: 44px;
    padding: 0;
    margin: 0;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    @media ${device.mobileL} {
      width: 40px;
    }
  }
  .react-datepicker__navigation {
    display: none;
  }
  .react-datepicker__current-month {
    display: none;
  }
  /* The range is drawn as one 36px track behind the numbers, with the two ends
     as knobs sitting on it — a full-height filled cell read as stray grey
     blocks with square corners where a week wrapped. */
  .react-datepicker__day--in-range,
  .react-datepicker__day--in-selecting-range,
  .react-datepicker__day--selected,
  .react-datepicker__day--range-start,
  .react-datepicker__day--range-end {
    background-color: transparent !important;
    color: ${({ theme }) => theme.colors.text.primary};
    border-radius: 0;
  }
  .react-datepicker__day--in-range:not(.react-datepicker__day--range-start):not(
      .react-datepicker__day--range-end
    ):not(.react-datepicker__day--selected)::before,
  .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--range-start):not(
      .react-datepicker__day--range-end
    ):not(.react-datepicker__day--selected)::before {
    content: '';
    position: absolute;
    inset: 4px 0;
    background-color: #f3f3f3;
    z-index: -1;
  }
  /* A wrapped week ends the track at Monday and Sunday, so round it there. */
  .react-datepicker__day--in-range:not(.react-datepicker__day--range-start):not(
      .react-datepicker__day--range-end
    ):not(.react-datepicker__day--selected):first-child::before,
  .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--range-start):not(
      .react-datepicker__day--range-end
    ):not(.react-datepicker__day--selected):first-child::before {
    border-radius: 18px 0 0 18px;
  }
  .react-datepicker__day--in-range:not(.react-datepicker__day--range-start):not(
      .react-datepicker__day--range-end
    ):not(.react-datepicker__day--selected):last-child::before,
  .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--range-start):not(
      .react-datepicker__day--range-end
    ):not(.react-datepicker__day--selected):last-child::before {
    border-radius: 0 18px 18px 0;
  }
  .react-datepicker__day--selected::after,
  .react-datepicker__day--range-start::after,
  .react-datepicker__day--range-end::after,
  .react-datepicker__day--selecting-range-start::after,
  .react-datepicker__day--selecting-range-end::after {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.black};
    z-index: -1;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--range-start,
  .react-datepicker__day--range-end,
  .react-datepicker__day--selecting-range-start,
  .react-datepicker__day--selecting-range-end,
  .react-datepicker__day--selected:hover,
  .react-datepicker__day--range-start:hover,
  .react-datepicker__day--range-end:hover {
    background-color: transparent !important;
    color: ${({ theme }) => theme.colors.white} !important;
  }
  .react-datepicker__children-container {
    width: 100%;
    margin: 0;
    padding: 0;
  }
`;

const CustomHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 13px 0 16px;
`;

const MonthLabel = styled.span`
  ${font('base', 500)};
  color: black;
  text-transform: capitalize;
  flex: 1;
  text-align: center;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.8rem;
  line-height: 1;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: background-color 0.15s ease;
  &:hover {
    background-color: #fafafa;
  }
`;

const MonthNavButton = styled(NavButton)``;
const YearNavButton = styled(NavButton)`
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -1px;
`;

const OkButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  margin-top: 16px;
  width: 100%;
`;

// The same black pill every other primary action uses.
const OkButton = styled.button`
  height: 40px;
  padding: 8px 24px;
  border-radius: 54px;
  background-color: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base')};
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  @media ${device.mobileL} {
    width: 100%;
  }
`;

export default DateRangePickerModal;
