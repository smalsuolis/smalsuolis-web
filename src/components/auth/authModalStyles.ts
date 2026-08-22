import { Button } from '@aplinkosministerija/design-system';
import styled from 'styled-components';
import { device, font } from '../../styles';

// Shared skeleton of the three auth modals (Prisijungimas / Registracija /
// Password reminder): the design gives all of them the same 24px block rhythm
// and the same footer — a link on one side, a black pill on the other, stacked
// with the pill on top once the frame narrows to a phone.
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const SubmitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media ${device.mobileL} {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 16px;

    /* The design-system Button renders inside a wrapper div, which is the flex
       item here — stretching the button alone would leave it 120px wide. */
    div:has(> button[type='submit']) {
      width: 100%;
    }
  }
`;

export const FootNote = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

export const Link = styled.span`
  text-decoration: underline;
  cursor: pointer;
`;

export const TextLink = styled.button`
  align-self: flex-start;
  padding: 0;
  background: transparent;
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

export const SubmitButton = styled(Button)`
  flex-shrink: 0;
  height: 40px;
  min-height: 40px;
  padding: 8px 24px;
  border-radius: 54px;
  background-color: ${({ theme }) => theme.colors.black};
  border-color: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  ${font('base')};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.grey[700]};
    border-color: ${({ theme }) => theme.colors.grey[700]};
  }

  @media ${device.mobileL} {
    width: 100%;
  }
`;

export const Error = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.error};
`;
