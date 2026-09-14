import styled from 'styled-components';
import { CONTENT_WIDTH, device } from '../../styles';

// Centered content column shared by every homepage section. The design puts
// content at x=56 on a 1440 canvas (x=16 on a 393 one), which the 1392 cap plus
// these gutters reproduces exactly.
export const Section = styled.section`
  width: 100%;
  max-width: ${CONTENT_WIDTH};
  margin: 0 auto;
  padding-left: 32px;
  padding-right: 32px;

  @media ${device.mobileL} {
    padding-left: 16px;
    padding-right: 16px;
  }
`;
