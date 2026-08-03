import styled from 'styled-components';
import { CONTENT_WIDTH, device } from '../../styles';

// Centered content column shared by every homepage section.
// The design lays sections out on a 1440 canvas with ~112px side gutters,
// giving a ~1216px content width. We cap at 1216 and pad in on smaller screens.
export const Section = styled.section`
  width: 100%;
  max-width: ${CONTENT_WIDTH};
  margin: 0 auto;
  padding-left: 32px;
  padding-right: 32px;

  @media ${device.mobileL} {
    padding-left: 20px;
    padding-right: 20px;
  }
`;
