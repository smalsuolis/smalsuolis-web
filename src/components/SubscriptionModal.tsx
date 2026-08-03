import { MapField, Modal, Switch, TextField } from '@aplinkosministerija/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import styled from 'styled-components';
import { device } from '../styles';
import { App, Frequency, SubscriptionForm, validateSubscriptionForm } from '../utils';
import api from '../utils/api';
import FrequencyPills from './FrequencyPills';
import SritysCheckList from './SritysCheckList';
import Icon from './Icons';
import LoaderComponent from './LoaderComponent';
import Popup from './Popup';
import { Button } from '@aplinkosministerija/design-system';
import { ButtonVariants } from '../styles';

interface Props {
  visible: boolean;
  // Subscription id to edit, or 'nauja' / undefined for a new one.
  id?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const SubscriptionModal = ({ visible, id, onClose, onSaved }: Props) => {
  const mapHost = import.meta.env.VITE_MAPS_HOST || 'https://dev.maps.biip.lt';
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);

  const isExisting = !!id && id !== 'nauja' && !isNaN(Number(id));

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => (isExisting ? api.getSubscription({ id: id as string }) : undefined),
    enabled: visible && isExisting,
  });

  const { data: appsResponse, isLoading: appsLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: () => api.getApps({ page: 1 }),
    enabled: visible,
  });

  const apps: App[] = appsResponse?.rows || [];

  const { data: categoryOptions = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', 'all', 'infostatyba'],
    queryFn: () => api.getAllCategories('infostatyba'),
    staleTime: Infinity,
    enabled: visible,
  });

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscription', id] });
    onSaved?.();
    onClose();
  };

  const { mutateAsync: createSubscription, isPending: creating } = useMutation({
    mutationFn: api.createSubscription,
    onSuccess,
  });

  const { mutateAsync: updateSubscription, isPending: updating } = useMutation({
    mutationFn: api.updateSubscription,
    onSuccess,
  });

  const { mutate: deleteSubscription, isPending: deleting } = useMutation({
    mutationFn: (subscriptionId: number) => api.deleteSubscription(subscriptionId),
    onSuccess: () => {
      setShowDelete(false);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      onClose();
    },
  });

  const loading = subscriptionLoading || appsLoading || categoriesLoading;
  const saving = creating || updating;

  const allApps = apps.map((app) => app.id);
  const noSubscription = !subscription?.id;
  const futureApps = subscription?.apps && subscription.apps?.length === 0;

  const initialValues: SubscriptionForm = {
    id: subscription?.id ?? 0,
    name: subscription?.name ?? '',
    apps: noSubscription || futureApps ? allApps : subscription?.apps || [],
    categories: subscription?.categories ?? [],
    geom: subscription?.geom,
    // WEEK is the first selectable pill; DAY is legacy-only (see FrequencyPills).
    frequency: subscription?.frequency || Frequency.WEEK,
    futureApps: subscription?.id ? (subscription?.apps || []).length === 0 : true,
    textFilter: subscription?.textFilter ?? '',
  };

  const handleSubmit = (values: SubscriptionForm) => {
    const params: SubscriptionForm = { ...values };
    if (values.futureApps) {
      params.apps = [];
    }
    if (!params.textFilter) {
      delete params.textFilter;
    }
    if (subscription?.id) {
      return updateSubscription({ id: subscription.id, params });
    }
    return createSubscription(params);
  };

  return (
    <>
      <Modal visible={visible} onClose={onClose}>
        <Shell>
          <Header>
            <div>
              <Title>{isExisting ? 'Prenumeratos valdymas' : 'Pridėti prenumeratą'}</Title>
              <Subtitle>
                Norėdami gauti el. paštu naujus įvykius, pasirinkite norimą teritoriją ir siuntimo
                kriterijus.
              </Subtitle>
            </div>
            <CloseButton type="button" onClick={onClose} aria-label="Uždaryti">
              <Icon name="close" />
            </CloseButton>
          </Header>

          {loading ? (
            <LoaderWrapper>
              <LoaderComponent />
            </LoaderWrapper>
          ) : (
            <Formik
              enableReinitialize={true}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              validateOnChange={false}
              validationSchema={validateSubscriptionForm}
            >
              {({ values, setFieldValue, errors }) => (
                <StyledForm>
                  <Body>
                    <Section>
                      <Label>Prenumeratos pavadinimas</Label>
                      <TextField
                        value={values.name}
                        type="text"
                        name="name"
                        placeholder="Įveskite pavadinimą"
                        error={errors.name}
                        onChange={(value) => setFieldValue('name', value)}
                      />
                    </Section>

                    <Section>
                      <HeadingRow>
                        <Label>Pasirinkite dominančias sritis</Label>
                        <SelectAllButton
                          type="button"
                          onClick={() => setFieldValue('apps', allApps)}
                        >
                          Žymėti viską
                        </SelectAllButton>
                      </HeadingRow>
                      <SritysCheckList
                        apps={apps}
                        categories={categoryOptions}
                        appIds={values.apps}
                        onAppIdsChange={(ids) => {
                          setFieldValue('apps', ids);
                          if (ids.length < apps.length) setFieldValue('futureApps', false);
                        }}
                        // The subscription form keeps ONE flat category list
                        // shared by the infostatyba apps (the API filters by
                        // categoryGroup, not per app), so every app row reads
                        // and writes the same `categories` value.
                        catsFor={() => values.categories}
                        onCatsChange={(appId, ids) => {
                          setFieldValue('categories', ids);
                          // Selecting categories implies the app itself is on.
                          if (ids.length && !values.apps.includes(appId)) {
                            setFieldValue('apps', [...values.apps, appId]);
                            setFieldValue('futureApps', false);
                          }
                        }}
                      />
                      <FutureAppsCard>
                        <FutureAppsHeader>
                          <Label>Automatinis naujų dominančių sričių pridėjimas</Label>
                          <Switch
                            value={values.futureApps}
                            onChange={(e) => {
                              setFieldValue('futureApps', e.target.checked);
                              setFieldValue('apps', allApps);
                            }}
                          />
                        </FutureAppsHeader>
                        <Description>
                          Kai tik atsiras nauja dominuojanti sritis, ji automatiškai pridedama prie
                          jūsų prenumeratos, užtikrinant, kad jūs visada būtumėte informuoti apie
                          visas naujienas.
                        </Description>
                      </FutureAppsCard>
                    </Section>

                    <Section>
                      <MapField
                        allow="geolocation *"
                        mapHost={mapHost}
                        mapPath={'/edit?types[]=point&buffer=xl&autoZoom=true&bufferMin=500'}
                        value={values.geom}
                        label={'Padėkite tašką, kur norite stebėti ir nustatykite spindulį'}
                        error={errors?.geom as string}
                        onChange={(value) => setFieldValue('geom', value)}
                      />
                    </Section>

                    <Section>
                      <Label>Kokiu dažnumu jums siųsti informaciją</Label>
                      <FrequencyPills
                        value={values.frequency}
                        onChange={(value) => setFieldValue('frequency', value)}
                      />
                    </Section>

                    <Section>
                      <Label>Tekstinis filtras (neprivaloma)</Label>
                      <TextField
                        value={values.textFilter}
                        type="text"
                        name="textFilter"
                        placeholder="Pvz.: Statybos leidimas"
                        onChange={(value) => setFieldValue('textFilter', value)}
                      />
                      <Description>
                        Jei nurodysite tekstą, gausite pranešimus tik apie tuos įvykius, kurių
                        pavadinime arba aprašyme yra šis žodis ar frazė.
                      </Description>
                    </Section>
                  </Body>

                  <Footer>
                    {isExisting ? (
                      <DeleteLink type="button" onClick={() => setShowDelete(true)}>
                        Ištrinti prenumeratą
                      </DeleteLink>
                    ) : (
                      <ClearLink
                        type="button"
                        onClick={() => {
                          setFieldValue('name', '');
                          setFieldValue('apps', []);
                          setFieldValue('categories', []);
                          setFieldValue('geom', undefined);
                          setFieldValue('textFilter', '');
                          setFieldValue('futureApps', false);
                        }}
                      >
                        Išvalyti viską
                      </ClearLink>
                    )}
                    <SubmitButton type="submit" loading={saving} disabled={saving}>
                      {isExisting ? 'Patvirtinti' : 'Pridėti'}
                    </SubmitButton>
                  </Footer>
                </StyledForm>
              )}
            </Formik>
          )}
        </Shell>
      </Modal>

      <Popup
        visible={showDelete}
        onClose={() => setShowDelete(false)}
        image="/warning_triangle.png"
        title="Ar tikrai norite ištrinti šią prenumeratą?"
        subTitle="Šio veiksmo nebus galima atšaukti ar redaguoti"
        allow
      >
        <PopupActions>
          <PopupButton variant={ButtonVariants.SECONDARY} onClick={() => setShowDelete(false)}>
            Atšaukti
          </PopupButton>
          <PopupButton
            variant={ButtonVariants.DANGER}
            disabled={deleting}
            onClick={() => (subscription?.id ? deleteSubscription(subscription.id) : undefined)}
          >
            Ištrinti
          </PopupButton>
        </PopupActions>
      </Popup>
    </>
  );
};

export default SubscriptionModal;

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  width: 100%;
  height: 100%;
  overflow: hidden;

  @media ${device.desktop} {
    width: 660px;
    max-width: 90vw;
    max-height: 86vh;
    height: auto;
    border-radius: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 32px 32px 16px 32px;
  flex-shrink: 0;

  @media ${device.mobileL} {
    padding: 20px 20px 12px 20px;
  }
`;

const Title = styled.h2`
  margin: 0 0 8px 0;
  font-size: 2.4rem;
  font-weight: 500;
`;

const Subtitle = styled.div`
  font-size: 1.4rem;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 2.4rem;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 32px 24px 32px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;

  @media ${device.mobileL} {
    padding: 8px 20px 20px 20px;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 1.5rem;
`;

const Description = styled.div`
  font-size: 1.3rem;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
`;

const SelectAllButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: underline;
  cursor: pointer;
  font-size: 1.4rem;
`;

const FutureAppsCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f7f7f7;
  border-radius: 12px;
  padding: 16px;
`;

const FutureAppsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media ${device.mobileL} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 32px;
  border-top: 1px solid #e5e5e5;
  background: white;
  flex-shrink: 0;

  @media ${device.mobileL} {
    flex-direction: column-reverse;
    padding: 16px 20px;
  }
`;

const DeleteLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #e11d48;
  text-decoration: underline;
  cursor: pointer;
  font-size: 1.4rem;
`;

const ClearLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: underline;
  cursor: pointer;
  font-size: 1.4rem;
`;

// Black pill, per the design — the DS Button defaults to the green primary,
// which is used for map/list actions rather than modal confirmation.
const SubmitButton = styled(Button)`
  min-width: 140px;
  height: 44px;
  background-color: ${({ theme }) => theme.colors.black};
  border-color: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.grey[700]};
    border-color: ${({ theme }) => theme.colors.grey[700]};
  }

  @media ${device.mobileL} {
    width: 100%;
  }
`;

const LoaderWrapper = styled.div`
  padding: 48px;
`;

const PopupActions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;

  @media ${device.mobileL} {
    padding: 0 16px;
  }
`;

const PopupButton = styled(Button)`
  height: 40px;
`;
