import { useNavigate } from 'react-router-dom';
import { useAuthModal } from '../auth/AuthModalContext';
import styled from 'styled-components';
import { device, font } from '../../styles';
import { IconName, slugs } from '../../utils';
import Icon from '../Icons';

// Multi-column site footer, shared across pages. Link columns route within the
// app or open external data sources; "Duomenų šaltiniai" hrefs match the Figma.
const Footer = () => {
  const navigate = useNavigate();
  const { open: openAuthModal } = useAuthModal();

  return (
    <Wrap>
      <Inner>
        <Brand onClick={() => navigate(slugs.home)}>
          <Icon name={IconName.sidebarLogo} />
        </Brand>

        <Columns>
          <Column>
            <ColTitle>Smalsuolio komanda</ColTitle>
            <ColText>Valstybės tarnautojai, kurie daro daugiau, nei kad prašoma.</ColText>
            <ColLink onClick={() => navigate(slugs.about)}>Mūsų komanda</ColLink>
          </Column>

          <Column>
            <ColTitle>Pastabos</ColTitle>
            <ColText>Jei turi komentarų ar pastabų. Visuomet jų laukiame.</ColText>
            <ColLink as="a" href="mailto:esu@smalsuolis.lt">
              esu@smalsuolis.lt
            </ColLink>
          </Column>

          <Column>
            <ColTitle>Duomenų šaltiniai</ColTitle>
            <ColLink
              as="a"
              href="https://get.data.gov.lt/datasets/gov/ssva/infostatyba/Statinys"
              target="_blank"
              rel="noreferrer"
            >
              Infostatyba
            </ColLink>
            <ColLink
              as="a"
              href="https://lkmp.alisas.lt/static/lkmp-data.geojson.zip"
              target="_blank"
              rel="noreferrer"
            >
              Miško kirtimų leidimai
            </ColLink>
            <ColLink
              as="a"
              href="https://zuvinimas.biip.lt/api/public/fishStockings"
              target="_blank"
              rel="noreferrer"
            >
              Įžuvinimai
            </ColLink>
          </Column>

          <Column>
            <ColTitle>Navigacija</ColTitle>
            <ColLink onClick={() => navigate(slugs.map)}>Žemėlapis</ColLink>
            <ColLink onClick={() => navigate(slugs.stats)}>Statistika</ColLink>
            <ColLink onClick={() => navigate(slugs.about)}>Apie mus</ColLink>
            <ColLink onClick={() => openAuthModal('login')}>Prisijungti</ColLink>
          </Column>
        </Columns>
      </Inner>

      <Copyright>© 2026 Smalsuolis. Visos teisės saugomos.</Copyright>
    </Wrap>
  );
};

export default Footer;

const Wrap = styled.footer`
  width: 100%;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  margin-top: 40px;
`;

const Inner = styled.div`
  max-width: 1216px;
  margin: 0 auto;
  padding: 56px 32px 40px;
  display: flex;
  gap: 64px;

  @media ${device.tablet} {
    flex-direction: column;
    gap: 40px;
  }

  @media ${device.mobileL} {
    padding: 40px 20px 32px;
  }
`;

const Brand = styled.div`
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;

  svg {
    height: 24px;
    width: auto;
  }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  flex: 1;

  @media ${device.mobileL} {
    grid-template-columns: 1fr 1fr;
    gap: 32px 24px;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ColTitle = styled.div`
  ${font('base', 700)};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const ColText = styled.div`
  ${font('base')};
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

const ColLink = styled.div`
  ${font('base')};
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Copyright = styled.div`
  max-width: 1216px;
  margin: 0 auto;
  padding: 24px 32px 40px;
  ${font('base')};
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.grey[500]};

  @media ${device.mobileL} {
    padding: 24px 20px 32px;
  }
`;
