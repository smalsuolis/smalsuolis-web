import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { CONTENT_WIDTH, device, font } from '../../styles';
import { AddressSuggestion, App, IconName, slugs } from '../../utils';
import api from '../../utils/api';
import Button from '../ui/Button';
import Icon from '../Icons';
import { Menu, MenuItem } from '../ui/Menu';
import AddressAutocomplete from './AddressAutocomplete';
import { SritysValue } from './SritysFilterModal';

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
  const [sritysOpen, setSritysOpen] = useState(false);
  const sritysRef = useRef<HTMLDivElement>(null);

  const { data: apps } = useQuery({
    queryKey: ['apps', 'all'],
    queryFn: () => api.getAllApps(),
    staleTime: Infinity,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (sritysRef.current && !sritysRef.current.contains(e.target as Node)) setSritysOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selectedApp = (apps ?? []).find((a: App) => a.id === srities.appIds[0]);
  const sritysLabel = selectedApp?.name ?? 'Sritys';

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
    <Hero $noSearch={!showSearch}>
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
            <SritysWrap ref={sritysRef}>
              <SritysButton
                type="button"
                onClick={() => setSritysOpen((v) => !v)}
                $active={!!selectedApp}
              >
                <SritysLabel>{sritysLabel}</SritysLabel>
                <ChevronIcon name={IconName.dropdownArrow} />
              </SritysButton>
              {sritysOpen && (
                <SritysMenu>
                  {(apps ?? []).map((app: App) => (
                    <MenuItem
                      key={app.id}
                      $active={app.id === srities.appIds[0]}
                      onClick={() => {
                        setSrities({ appIds: [app.id], categoriesByApp: {} });
                        setSritysOpen(false);
                      }}
                    >
                      {app.name}
                    </MenuItem>
                  ))}
                </SritysMenu>
              )}
            </SritysWrap>
            <SearchButtonWrap>
              <Button onClick={goToMap}>Ieškoti</Button>
            </SearchButtonWrap>
          </SearchBar>
        </SearchBarWrap>
      )}
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
const Hero = styled.div<{ $noSearch?: boolean }>`
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
       transparent nav it is pulled under — and ends 151px past the copy. Apie
       mus has no search card hanging off it, so its band is the shorter 316. */
    padding-top: ${({ $noSearch }) => ($noSearch ? '133px' : '104px')};
    padding-bottom: ${({ $noSearch }) => ($noSearch ? '66px' : '151px')};
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
    /* The phone frame sets the headline in a 276px measure, not the full
       column — that is what gives it its line count. */
    max-width: 276px;
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
    /* The 8px above is a desktop baseline nudge the 436px band absorbs; on the
       phone it would push the whole page 8px down. */
    margin-bottom: 0;
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

// Design: the picker is a menu of the source apps, not a modal — the frame
// shows the same dropdown the address field and the period pickers use.
const SritysWrap = styled.div`
  position: relative;
  flex-shrink: 0;

  @media ${device.mobileL} {
    width: 100%;
  }
`;

const SritysMenu = styled(Menu)`
  position: absolute;
  /* The frame hangs the menu 4px under the input and draws all eight rows. */
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 40;
  max-height: 392px;
`;

const SritysLabel = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SritysButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  width: 300px;
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
