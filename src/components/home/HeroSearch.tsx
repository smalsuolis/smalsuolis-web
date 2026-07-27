import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { device, font } from '../../styles';
import { AddressSuggestion, IconName, slugs } from '../../utils';
import Button from '../ui/Button';
import Icon from '../Icons';
import AddressAutocomplete from './AddressAutocomplete';
import SritysFilterModal, { SritysValue } from './SritysFilterModal';

// Hero band: full-bleed green gradient, headline + supporting copy, and the white
// search bar (address autocomplete + Sritys) overlapping the bottom edge.
const HeroSearch = () => {
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
        <HeroContent>
          <Heading>
            Sužinok, kas vyksta
            <br />
            šalia tavęs
          </Heading>
          <SupportCopy>
            Statybų leidimai, miškų kirtimai, aplinkos vertinimai.
            <br />
            Sužinok pirmas, kas planuojama šalia tavęs.
          </SupportCopy>
        </HeroContent>
      </HeroInner>

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
          <Divider />
          <SritysButton type="button" onClick={() => setFilterOpen(true)} $active={sritysCount > 0}>
            <span>{sritysLabel}</span>
            <ChevronIcon name={IconName.dropdownArrow} />
          </SritysButton>
          <SearchButtonWrap>
            <Button onClick={goToMap}>Ieškoti</Button>
          </SearchButtonWrap>
        </SearchBar>
      </SearchBarWrap>

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

// The exported Figma artwork (green field + swept line texture), stretched to
// the hero box so the whole sweep stays visible rather than being scaled up and
// cropped. Flat base green backs it for any rounding gap.
const Hero = styled.div`
  position: relative;
  width: 100%;
  background:
    url('/frame.svg') center / 100% 100% no-repeat,
    #7eec9b;
  padding-top: 96px;
  padding-bottom: 88px;

  @media ${device.mobileL} {
    /* The hero is pulled up under the 64px-tall transparent nav; clear it so
       the heading sits below the logo/burger row (nav height + breathing room). */
    padding-top: 88px;
    /* Reserve room for the tall vertically-stacked search bar that overhangs
       the hero's bottom edge. */
    padding-bottom: 210px;
  }
`;

const HeroInner = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1216px;
  margin: 0 auto;
  padding: 0 32px;

  @media ${device.mobileL} {
    padding: 0 20px;
  }
`;

const HeroContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 48px;
  flex-wrap: wrap;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
`;

const Heading = styled.h1`
  ${font('6xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;

  @media ${device.mobileL} {
    ${font('3xl')};
    font-weight: 700;
  }
`;

const SupportCopy = styled.p`
  ${font('lg')};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 8px 0;
  max-width: 380px;

  @media ${device.mobileL} {
    ${font('base')};
    max-width: none;
  }
`;

const SearchBarWrap = styled.div`
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  bottom: -40px;
  padding: 0 32px;

  @media ${device.mobileL} {
    padding: 0 20px;
    /* The bar stacks vertically on mobile (much taller), so it overhangs by a
       smaller amount; the first content section reserves clearance below. */
    bottom: -24px;
  }
`;

const SearchBar = styled.div`
  max-width: 1152px;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.white};
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
    border-radius: 20px;
    gap: 10px;
  }
`;

const SearchInputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
  padding: 0 12px;

  @media ${device.mobileL} {
    min-width: 0;
    padding: 14px 16px;
    border: 1px solid ${({ theme }) => theme.colors.grey[500]};
    border-radius: 44px;
  }
`;

// "Sritys" trigger — DS Input styling (44px radius, 56px, grey-500 border).
// Opens the SritysFilterModal.
const SritysButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  min-width: 200px;
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

const Divider = styled.div`
  width: 1px;
  align-self: stretch;
  background: ${({ theme }) => theme.colors.grey[300]};

  @media ${device.mobileL} {
    display: none;
  }
`;

// On mobile the search bar stacks vertically; the action button spans the full
// width. Stretch the underlying <button> to fill this wrapper.
const SearchButtonWrap = styled.div`
  @media ${device.mobileL} {
    width: 100%;
    button {
      width: 100%;
      padding-top: 14px;
      padding-bottom: 14px;
    }
  }
`;
