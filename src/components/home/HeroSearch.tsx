import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { device, font } from '../../styles';
import { IconName, slugs } from '../../utils';
import Icon from '../Icons';
import Button from '../ui/Button';

// Hero band: full-bleed green gradient with topographic texture, headline +
// supporting copy, and the white search bar overlapping the bottom edge.
const HeroSearch = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');

  const onSearch = () => {
    // Route into the events feed; address search wiring comes with the
    // events-page redesign. For now this takes the user to the news list.
    navigate(slugs.events);
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
            <SearchIcon name={IconName.search} />
            <SearchInput
              placeholder="Įveskite dominantį adresą"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
          </SearchInputWrap>
          <Divider />
          <RegionSelect>
            <span>Sritys</span>
            <ChevronIcon name={IconName.dropdownArrow} />
          </RegionSelect>
          <Button onClick={onSearch}>Ieškoti</Button>
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
    padding-top: 48px;
    padding-bottom: 72px;
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
`;

const Heading = styled.h1`
  ${font('6xl')};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;

  @media ${device.mobileL} {
    ${font('5xl')};
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
    bottom: -56px;
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
    flex-wrap: wrap;
    border-radius: 20px;
  }
`;

const SearchInputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 200px;
  padding: 0 12px;
`;

const SearchIcon = styled(Icon)`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  background: transparent;
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.grey[600]};
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

const RegionSelect = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  min-width: 160px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  ${font('base')};
  color: ${({ theme }) => theme.colors.grey[600]};

  @media ${device.mobileL} {
    flex: 1;
  }
`;

const ChevronIcon = styled(Icon)`
  font-size: 1.6rem;
  color: ${({ theme }) => theme.colors.grey[600]};
`;
