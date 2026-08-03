import { useNavigate } from 'react-router-dom';
import { useAuthModal } from '../auth/AuthModalContext';
import styled from 'styled-components';
import { CONTENT_WIDTH, device, font } from '../../styles';
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
            <ColText>Valstybės tarnautojai, kurie daro daugiau, nei kad prašoma</ColText>
          </Column>

          <Column>
            <ColTitle>Pastabos</ColTitle>
            <ColText>Jei turi komentarų ar pastabų Visuomet jų laukiame</ColText>
            <ColLink $strong as="a" href="mailto:esu@smalsuolis.lt">
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
  background: ${({ theme }) => theme.colors.white};
`;

const Inner = styled.div`
  max-width: ${CONTENT_WIDTH};
  margin: 0 auto;
  padding: 80px 32px 0;
  display: grid;
  /* Logo occupies its own first column, top-aligned with the headings. */
  grid-template-columns: 220px 1fr;
  gap: 32px;

  @media ${device.mobileL} {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 56px 20px 0;
  }
`;

const Brand = styled.div`
  cursor: pointer;
  display: flex;
  align-items: flex-start;

  svg {
    height: 26px;
    width: auto;
  }
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;

  /* Single stacked column on phones — the 2-up grid cramped the longer
     link labels. */
  @media ${device.mobileL} {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Headings sit at regular weight, only a step up in size from the links —
// hierarchy comes from colour (near-black vs. grey), not weight.
const ColTitle = styled.div`
  ${font('base', 400)};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 2px;
`;

const ColText = styled.div`
  ${font('base', 400)};
  font-size: 1.4rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.grey[600]};
`;

// `$strong` marks the actionable link that closes a text column (Mūsų komanda,
// the contact address) — near-black against the grey body copy above it.
const ColLink = styled.div<{ $strong?: boolean }>`
  ${font('base', 400)};
  font-size: 1.4rem;
  line-height: 1.45;
  color: ${({ theme, $strong }) => ($strong ? theme.colors.text.primary : theme.colors.grey[600])};
  cursor: pointer;
  width: fit-content;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Copyright = styled.div`
  max-width: ${CONTENT_WIDTH};
  margin: 0 auto;
  padding: 48px 32px 32px;
  ${font('base', 400)};
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.text.primary};

  @media ${device.mobileL} {
    padding: 32px 20px 24px;
  }
`;
