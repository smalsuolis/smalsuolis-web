import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { device, font } from '../../styles';
import { AddressSuggestion, slugs } from '../../utils';
import Button from '../ui/Button';
import AddressAutocomplete from './AddressAutocomplete';
import SritysSelect from './SritysSelect';

// Hero band: full-bleed green gradient, headline + supporting copy, and the white
// search bar (address autocomplete + Sritys) overlapping the bottom edge.
const HeroSearch = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [appIds, setAppIds] = useState<number[]>([]);

  const onSearch = () => {
    // Go to the map page. Pass the resolved point + filters via router state so
    // the map centers immediately; mirror them in the URL for linkability.
    const params = new URLSearchParams();
    if (address) params.set('address', address);
    if (appIds.length) params.set('app', appIds.join(','));
    navigate(`${slugs.map}?${params.toString()}`, {
      state: { address, suggestion: selected, appIds },
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
              onSubmit={onSearch}
            />
          </SearchInputWrap>
          <Divider />
          <SritysSelect value={appIds} onChange={setAppIds} />
          <SearchButtonWrap>
            <Button onClick={onSearch}>Ieškoti</Button>
          </SearchButtonWrap>
        </SearchBar>
      </SearchBarWrap>
    </Hero>
  );
};

export default HeroSearch;

const Hero = styled.div`
  position: relative;
  width: 100%;
  background: linear-gradient(120deg, #d6f5de 0%, #9fe8b2 50%, #73dc8c 100%);
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
  color: ${({ theme }) => theme.colors.grey[700]};
  margin: 0 0 8px 0;
  max-width: 380px;

  @media ${device.mobileL} {
    ${font('base')};
    max-width: none;
  }
`;

const SearchBarWrap = styled.div`
  position: absolute;
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
