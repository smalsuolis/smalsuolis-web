import styled from 'styled-components';
import { device, font } from '../../styles';

// The mission paragraph shared by the homepage and Apie mus. The 1440 frame sets
// it as one centred block; the 393 one breaks it in two, left-aligned, with a
// blank line between — so the second sentence becomes its own block on phones.
const IntroCopy = () => (
  <Intro>
    <Strong>Mūsų valstybėje vyksta daug įvykių</Strong>, tačiau apie juos nežinome arba sužinome per
    vėlai.{' '}
    <SecondParagraph>
      Nusprendėme tą pakeisti – <Strong>suteikti galimybę visiems piliečiams</Strong> sekti kas
      vyksta šalyje realiu laiku.
    </SecondParagraph>
  </Intro>
);

export default IntroCopy;

const Intro = styled.p`
  ${font('3xl', 400)};
  text-align: center;
  color: ${({ theme }) => theme.colors.grey[550]};
  max-width: 876px;
  margin: 0 auto;

  @media ${device.mobileL} {
    ${font('2xl', 400)};
    text-align: left;
    max-width: none;
  }
`;

// The design emphasises these runs with colour alone — the weight stays 400.
const Strong = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SecondParagraph = styled.span`
  @media ${device.mobileL} {
    display: block;
    /* One empty line at the 24/31 mobile scale. */
    margin-top: 31px;
  }
`;
