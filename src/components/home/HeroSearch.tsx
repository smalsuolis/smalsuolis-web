import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { CONTENT_WIDTH, device, font } from '../../styles';
import { AddressSuggestion, IconName, slugs } from '../../utils';
import Button from '../ui/Button';
import Icon from '../Icons';
import AddressAutocomplete from './AddressAutocomplete';
import SritysFilterModal, { SritysValue } from './SritysFilterModal';

// Hero band: full-bleed green gradient, headline + supporting copy, and the white
// search bar (address autocomplete + Sritys) overlapping the bottom edge.
// Apie mus reuses the band with its own centred heading, no support copy and
// no search card — that layer is switched off on its Figma frame.
const HeroSearch = ({
  heading,
  supportCopy,
  showSearch = true,
}: {
  heading?: ReactNode;
  supportCopy?: ReactNode;
  showSearch?: boolean;
}) => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [srities, setSrities] = useState<SritysValue>({ appIds: [], categoriesByApp: {} });
  const [filterOpen, setFilterOpen] = useState(false);

  const sritysCount = srities.appIds.length;
  const sritysLabel = sritysCount === 0 ? 'Sritys' : `Sritys (${sritysCount})`;

  const goToMap = () => {
    // Go to the map page with the search pre-filled. The resolved point and the
    // full Sritys selection (apps + per-app categories) travel via router state
    // so the map opens ready-to-go; address + app ids are also mirrored in the
    // URL for linkability/refresh (categories are state-only — too nested for a
    // clean query param, and re-openable via the Sritys modal).
    const params = new URLSearchParams();
    if (address) params.set('address', address);
    if (srities.appIds.length) params.set('app', srities.appIds.join(','));
    navigate(`${slugs.map}?${params.toString()}`, {
      state: { address, suggestion: selected, srities },
    });
  };

  return (
    <Hero>
      <HeroInner>
        <HeroContent $centered={supportCopy === null}>
          <Heading $centered={supportCopy === null}>
            {heading ?? (
              <>
                Sužinok, kas vyksta
                <br />
                šalia tavęs
              </>
            )}
          </Heading>
          {supportCopy !== null && (
            <SupportCopy>
              {supportCopy ?? (
                <>
                  Statybų leidimai, miškų kirtimai, aplinkos vertinimai.
                  <br />
                  Sužinok pirmas, kas planuojama šalia tavęs.
                </>
              )}
            </SupportCopy>
          )}
        </HeroContent>
      </HeroInner>

      {showSearch && (
        <SearchBarWrap>
          <SearchBar>
            <SearchInputWrap>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSelect={setSelected}
                onSubmit={goToMap}
              />
            </SearchInputWrap>
            <SritysButton
              type="button"
              onClick={() => setFilterOpen(true)}
              $active={sritysCount > 0}
            >
              <span>{sritysLabel}</span>
              <ChevronIcon name={IconName.dropdownArrow} />
            </SritysButton>
            <SearchButtonWrap>
              <Button onClick={goToMap}>Ieškoti</Button>
            </SearchButtonWrap>
          </SearchBar>
        </SearchBarWrap>
      )}

      <SritysFilterModal
        visible={filterOpen}
        value={srities}
        onChange={setSrities}
        onApply={() => {
          setFilterOpen(false);
          goToMap();
        }}
        onClose={() => setFilterOpen(false)}
      />
    </Hero>
  );
};

export default HeroSearch;

// Flattened PNG export of the Figma hero band (1440x436). The SVG version drew
// its line work through a color-dodge blend, which Figma resolves to soft white
// but a CSS background-image renders as dark strokes — hence "linijos tamsios"
// in QA. The PNG bakes the intended result in.
//
// Padding follows the design frame: the 1440x436 band puts the heading at
// y=160, measured from the top of the hero (the 80px navbar overlays it).
const Hero = styled.div`
  position: relative;
  width: 100%;
  background:
    url('/hero_bg.png') center / 100% 100% no-repeat,
    #7eec9b;
  /* Fixed 436px band, per the design frame — the height was previously
     content-driven, so it collapsed to whatever the heading needed and the
     green stopped right at the search card. */
  min-height: 436px;
  padding-top: 160px;
  padding-bottom: 88px;

  @media ${device.mobileL} {
    min-height: 0;
    /* Flat green on phones: the artwork is a 1440x436 landscape sweep, and
       squeezing it into a ~390px portrait band distorts the line work into
       noise. The colour underneath stays the one the design specifies. */
    background: #7eec9b;
    /* The 393x417 mobile band puts the heading at y=104 — below the 80px
       transparent nav it is pulled under — and ends 151px past the copy. */
    padding-top: 104px;
    padding-bottom: 151px;
  }
`;

const HeroInner = styled.div`
  position: relative;
  z-index: 1;
  max-width: ${CONTENT_WIDTH};
  margin: 0 auto;
  padding: 0 32px;

  @media ${device.mobileL} {
    padding: 0 16px;
  }
`;

const HeroContent = styled.div<{ $centered?: boolean }>`
  display: flex;
  justify-content: ${({ $centered }) => ($centered ? 'center' : 'space-between')};
  align-items: flex-end;
  gap: 48px;
  flex-wrap: wrap;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const Heading = styled.h1<{ $centered?: boolean }>`
  ${font('6xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: ${({ $centered }) => ($centered ? 'center' : 'left')};
  margin: 0;

  @media ${device.mobileL} {
    ${font('3xl', 800)};
  }
`;

const SupportCopy = styled.p`
  ${font('xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 8px 0;
  max-width: 478px;

  @media ${device.mobileL} {
    ${font('base')};
    max-width: none;
  }
`;

// Design: the 1312x140 search card sits at y=362 in a 436-tall hero, so it
// hangs 66px past the bottom edge.
const SearchBarWrap = styled.div`
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  bottom: -66px;
  padding: 0 32px;

  @media ${device.mobileL} {
    padding: 0 16px;
    /* Stacked vertically the card is 220 tall against a 417 band, so it hangs
       105px past the bottom edge. */
    bottom: -105px;
  }
`;

const SearchBar = styled.div`
  max-width: 1312px;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 28px;
  /* Inset ring rather than a border: a Figma stroke is drawn inside the frame
     without shrinking its content box, so a real border would cost the row
     2px and leave the address field 736 instead of 738. */
  box-shadow:
    inset 0 0 0 1px #d4d3d3,
    0 12px 40px rgba(0, 0, 0, 0.08);
  padding: 42px;
  display: flex;
  align-items: center;
  gap: 10px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
    border-radius: 28px;
    padding: 16px;
    gap: 10px;
  }
`;

const SearchInputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
  height: 56px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.grey[500]};
  border-radius: 44px;

  @media ${device.mobileL} {
    min-width: 0;
    /* Stacked, the card is a column flex, where flex: 1 zeroes the basis on
       the main axis and collapses the field to its content height. */
    flex: none;
  }
`;

// Opens the SritysFilterModal.
const SritysButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  width: 300px;
  flex-shrink: 0;
  min-height: 56px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.grey[500]};
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  ${font('lg')};
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.grey[500])};

  @media ${device.mobileL} {
    width: 100%;
    min-width: 0;
  }
`;

const ChevronIcon = styled(Icon)`
  font-size: 1.6rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  flex-shrink: 0;
`;

// On mobile the search bar stacks vertically; the action button spans the full
// width. Stretch the underlying <button> to fill this wrapper.
const SearchButtonWrap = styled.div`
  flex-shrink: 0;

  button {
    width: 170px;
    height: 56px;
  }

  @media ${device.mobileL} {
    width: 100%;
    button {
      width: 100%;
      padding-top: 14px;
      padding-bottom: 14px;
    }
  }
`;
