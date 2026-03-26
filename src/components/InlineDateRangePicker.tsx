import { device } from '@aplinkosministerija/design-system';
import { lt } from 'date-fns/locale';
import Datepicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styled from 'styled-components';

registerLocale('lt', lt);

export interface DateRangePickerProps {
  onDateChange: ({ start, end }) => void;
  endDate?: Date;
  startDate?: Date;
}

const InlaneDateRangePicker = ({ onDateChange, endDate, startDate }: DateRangePickerProps) => {
  return (
    <Container>
      <DateContainer>
        <Datepicker
          locale="lt"
          selected={startDate}
          onChange={(dates) => {
            const [start, end] = dates;
            onDateChange({ start, end });
          }}
          startDate={startDate}
          endDate={endDate}
          selectsRange
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
            </CustomHeader>
          )}
        />
      </DateContainer>
    </Container>
  );
};

const DateContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
  margin-bottom: 16px;
  &:focus {
    outline: none;
  }
  @media ${device.mobileL} {
    margin-top: 8px;
  }
`;

const Container = styled.div`
  .react-datepicker__header {
    background-color: #ffffff !important;
    border: none;
  }
  .react-datepicker__day--outside-month {
    color: #151229;
    opacity: 0.6;
  }
  .react-datepicker__day {
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
      background-color: ${({ theme }) => theme.colors.tertiary} !important;
      color: white;
    }
    @media ${device.mobileL} {
      width: 40px;
      height: 40px;
      line-height: 40px;
    }
  }
  .react-datepicker {
    background-color: #ffffff;
    z-index: 8;
    border-radius: 10px;
    padding: 0px 26px 20px 26px;
    border: none;
    @media ${device.mobileL} {
      padding: 0px 16px 20px 16px;
      width: 375px;
    }
  }
  .react-datepicker__day--selected {
    background-color: white;
    position: relative;
    z-index: 1;
    font-size: 1.5rem;
    background-color: ${({ theme }) => theme.colors.tertiary} !important;
    color: white;
    border-radius: 50%;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: ${({ theme }) => theme.colors.tertiary};
    color: white;
    text-align: center;
    font-size: 1.5rem;
    border-radius: 50%;
    &:focus {
      outline: none;
    }
    &::before {
      content: '';
      position: absolute;
      background-color: ${({ theme }) => theme.colors.tertiary};
      text-align: center;
      z-index: -1;
    }
  }
  .react-datepicker__day-name {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.tertiary};
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
  .react-datepicker__day--in-range {
    background-color: ${({ theme }) => theme.colors.tertiary} !important;
    color: #101828 !important;
    border-radius: 0px !important;
    z-index: 5 !important;
    margin: 0 !important;
    color: white !important;
  }
  .react-datepicker__day--range-start,
  .react-datepicker__day--range-end {
    background-color: ${({ theme }) => theme.colors.tertiary} !important;
    color: white !important;
    position: relative !important;
    z-index: 1 !important;
  }
  .react-datepicker__day--range-start {
    border-top-left-radius: 50% !important;
    border-bottom-left-radius: 50% !important;
  }
  .react-datepicker__day--range-end {
    border-top-right-radius: 50% !important;
    border-bottom-right-radius: 50% !important;
  }
  .react-datepicker__day--range-start::before,
  .react-datepicker__day--range-end::before {
    content: '';
    width: 28px;
    height: 28px;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 0px;
    z-index: -1;
  }
  .react-datepicker__day--range-end::before {
    margin-left: 13px;
    transform: translate(-10px, -50%);
  }
  .react-datepicker__day--in-selecting-range {
    background-color: #dff9e5 !important;
    color: #101828;
    border-radius: 50% !important;
  }
`;

const CustomHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 13px 0 16px;
`;

const MonthLabel = styled.span`
  font-size: 1.5rem;
  font-weight: 600;
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
  color: ${({ theme }) => theme.colors.tertiary};
  transition: background-color 0.15s ease;
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}40;
  }
`;

const MonthNavButton = styled(NavButton)``;
const YearNavButton = styled(NavButton)`
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -1px;
`;

export default InlaneDateRangePicker;
