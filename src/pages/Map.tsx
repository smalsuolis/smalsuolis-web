import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import MapView from '../components/MapView';
import AddressAutocomplete from '../components/home/AddressAutocomplete';
import SritysSelect from '../components/home/SritysSelect';
import Button from '../components/ui/Button';
import { device } from '../styles';
import { AddressSuggestion } from '../utils';
import api from '../utils/api';

// A GeoJSON Point → a FeatureCollection the maps.biip.lt iframe autozooms to.
const pointToFeatureCollection = (geometry: AddressSuggestion['geometry']) => ({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', geometry, properties: {} }],
});

// Redesigned map page. Shows the events map (maps.biip.lt iframe) filling the
// viewport, with a floating search bar (address autocomplete + Sritys) overlaid.
// Selecting an address centers the map on its point; Sritys filters event types.
// URL state (?address=&app=) keeps it linkable/reloadable.
const MapPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Seed from router state (passed by the homepage hero) so the map centers
  // immediately without a round-trip; fall back to URL params on reload.
  const navState = location.state as {
    address?: string;
    suggestion?: AddressSuggestion;
    appIds?: number[];
  } | null;

  const [address, setAddress] = useState(navState?.address ?? searchParams.get('address') ?? '');
  const [selected, setSelected] = useState<AddressSuggestion | null>(navState?.suggestion ?? null);
  const [appIds, setAppIds] = useState<number[]>(
    navState?.appIds ??
      (searchParams.get('app')
        ? searchParams.get('app')!.split(',').map(Number).filter(Boolean)
        : []),
  );

  // On reload with ?address= but no resolved point (no router state), re-run the
  // suggest query once and take the best match so the map can still center.
  useEffect(() => {
    const urlAddress = searchParams.get('address');
    if (!selected && urlAddress && urlAddress.trim().length >= 3) {
      api
        .suggestAddresses(urlAddress)
        .then((results) => {
          if (results[0]) setSelected(results[0]);
        })
        .catch(() => undefined);
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync with the current selection/filters.
  useEffect(() => {
    const next: Record<string, string> = {};
    if (address) next.address = address;
    if (appIds.length) next.app = appIds.join(',');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, appIds]);

  const geom = useMemo(
    () => (selected ? pointToFeatureCollection(selected.geometry) : undefined),
    [selected],
  );

  const filters = useMemo(() => (appIds.length ? { app: { $in: appIds } } : undefined), [appIds]);

  return (
    <Page>
      <FloatingBar>
        <BarField>
          <AddressAutocomplete value={address} onChange={setAddress} onSelect={setSelected} />
        </BarField>
        <BarDivider />
        <SritysSelect value={appIds} onChange={setAppIds} />
        <Button onClick={() => undefined}>Ieškoti</Button>
      </FloatingBar>

      <MapWrap>
        <MapView geom={geom} filters={filters} height="100%" />
      </MapWrap>
    </Page>
  );
};

export default MapPage;

const Page = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 72px);

  @media ${device.mobileL} {
    height: calc(100vh - 64px);
  }
`;

const MapWrap = styled.div`
  position: absolute;
  inset: 0;

  iframe {
    height: 100% !important;
  }
`;

const FloatingBar = styled.div`
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  width: min(1000px, calc(100% - 48px));
  background: ${({ theme }) => theme.colors.white};
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: stretch;
    top: 12px;
    width: calc(100% - 24px);
    border-radius: 20px;
  }
`;

const BarField = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding: 0 12px;

  @media ${device.mobileL} {
    padding: 12px 14px;
    border: 1px solid ${({ theme }) => theme.colors.grey[500]};
    border-radius: 44px;
  }
`;

const BarDivider = styled.div`
  width: 1px;
  align-self: stretch;
  background: ${({ theme }) => theme.colors.grey[300]};

  @media ${device.mobileL} {
    display: none;
  }
`;
