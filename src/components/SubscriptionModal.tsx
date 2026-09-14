import { MapField, Modal, Switch, TextField } from '@aplinkosministerija/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import styled, { css } from 'styled-components';
import { device, font } from '../styles';
import {
  App,
  buttonsTitles,
  Frequency,
  SubscriptionForm,
  validateSubscriptionForm,
} from '../utils';
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
  const mapHost = import.meta.env.VITE_MAPS_HOST || 'https://dev-maps.biip.lt';
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
    // The design opens a NEW subscription with nothing ticked and the automatic
    // toggle on — that pair already means "every source, including future ones".
    // An existing automatic one is stored as an empty list but means every
    // source, so the form holds them and handleSubmit writes the empty list back.
    apps: noSubscription ? [] : futureApps ? allApps : subscription?.apps || [],
    categories: subscription?.categories ?? [],
    geom: subscription?.geom,
    // WEEK is the first selectable pill; DAY is legacy-only (see FrequencyPills).
    frequency: subscription?.frequency || Frequency.WEEK,
    // Off to start with: a new subscription asks for an explicit choice (the
    // validation requires one area), and the switch is opt-in rather than
    // something to notice and undo. An existing one still reports what it holds.
    futureApps: subscription?.id ? (subscription?.apps || []).length === 0 : false,
    textFilter: subscription?.textFilter ?? '',
  };

  // Every source is on either because each one is ticked or because the
  // automatic toggle stands in for the whole set.
  const allSelected = (values: SubscriptionForm) =>
    (isExisting && values.futureApps) ||
    (allApps.length > 0 && values.apps.length >= allApps.length);

  const toggleAll = (
    values: SubscriptionForm,
    setFieldValue: (field: string, value: unknown) => void,
  ) => {
    const clearing = allSelected(values);
    setFieldValue('apps', clearing ? [] : allApps);
    if (clearing) setFieldValue('categories', []);
    // Either way this is an explicit choice, so it supersedes the automatic set.
    setFieldValue('futureApps', false);
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
        <Shell data-modal-card>
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
                    <TextField
                      label="Prenumeratos pavadinimas"
                      value={values.name}
                      type="text"
                      name="name"
                      placeholder="Įveskite pavadinimą"
                      error={errors.name}
                      onChange={(value) => setFieldValue('name', value)}
                    />

                    <Section>
                      <HeadingRow>
                        <Label>Pasirinkite dominančias sritis</Label>
                        <SelectAllButton
                          type="button"
                          onClick={() => toggleAll(values, setFieldValue)}
                        >
                          {allSelected(values)
                            ? buttonsTitles.deselectAll
                            : buttonsTitles.selectAll}
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
                        sharedCategories
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
                          <CardLabel>Automatinis naujų dominančių sričių pridėjimas</CardLabel>
                          <Switch
                            value={values.futureApps}
                            onChange={(e) => {
                              setFieldValue('futureApps', e.target.checked);
                              // Turning it on means every source, so show every
                              // source — it used to wipe the ticks instead.
                              if (e.target.checked) setFieldValue('apps', allApps);
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
          <CancelButton type="button" onClick={() => setShowDelete(false)}>
            Atšaukti
          </CancelButton>
          <ConfirmButton
            type="button"
            disabled={deleting}
            onClick={() => (subscription?.id ? deleteSubscription(subscription.id) : undefined)}
          >
            Ištrinti
          </ConfirmButton>
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
  max-width: 361px;
  max-height: 88vh;
  border-radius: 8px;
  overflow: hidden;

  @media ${device.desktop} {
    width: 660px;
    max-width: 90vw;
    max-height: 86vh;
  }

  label {
    ${font('base')};
    color: ${({ theme }) => theme.colors.text.primary};
    /* Design: 8px between a field's label and its box (the DS ships 4). */
    margin-bottom: 4px;
  }

  div:has(> input:not([type='checkbox'])) {
    height: 40px;
    border-radius: 100px;
    border-color: ${({ theme }) => theme.colors.grey[500]};
  }

  div:has(> input:not([type='checkbox'])) > input {
    height: 38px;
    padding: 0 12px;
  }

  /* The design paints a field's message and its hairline red when it fails. */
  div:has(> input:not([type='checkbox'])) + label {
    color: ${({ theme }) => theme.colors.text.error};
  }
  div:has(> input:not([type='checkbox'])):has(+ label) {
    border-color: ${({ theme }) => theme.colors.text.error};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 0;
  flex-shrink: 0;

  @media ${device.mobileL} {
    padding: 24px 16px 0;
  }
`;

const Title = styled.h2`
  margin: 0 0 8px 0;
  ${font('2xl')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Subtitle = styled.div`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
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
  gap: 36px;
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;

  @media ${device.mobileL} {
    padding: 24px 16px;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.label`
  ${font('base')};
  color: ${({ theme }) => theme.colors.text.primary};
`;

// The frame sets the automatic-adding heading a size up.
const CardLabel = styled.div`
  ${font('lg', 500)};
  line-height: 2.34rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Description = styled.div`
  ${font('sm')};
  color: ${({ theme }) => theme.colors.grey[700]};
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

// Design: an 8px-radius #FAFAFA card with 16/24 padding and a 10px gap.
const FutureAppsCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafafa;
  border-radius: 8px;
  padding: 16px 24px;
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
  padding: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: white;
  flex-shrink: 0;

  @media ${device.mobileL} {
    flex-direction: column-reverse;
    padding: 16px;
  }
`;

const DeleteLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #e11d48;
  text-decoration: underline;
  cursor: pointer;
  ${font('base')};
`;

const ClearLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: underline;
  cursor: pointer;
  ${font('base')};
`;

// Black pill, per the design — the DS Button defaults to the green primary,
// which is used for map/list actions rather than modal confirmation.
const SubmitButton = styled(Button)`
  min-width: 130px;
  height: 40px;
  min-height: 40px;
  padding: 8px 24px;
  border-radius: 54px;
  background-color: ${({ theme }) => theme.colors.black};
  border-color: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};

  /* Fill only — the DS button would otherwise repaint the label dark. */
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.grey[700]};
    border-color: ${({ theme }) => theme.colors.grey[700]};
    color: ${({ theme }) => theme.colors.white};
  }

  /* Disabled, it answers the pointer with nothing — the DS hover has no guard
     of its own and would paint the variant's green over it. */
  &:hover:disabled {
    background-color: ${({ theme }) => theme.colors.black};
    border-color: ${({ theme }) => theme.colors.black};
    color: ${({ theme }) => theme.colors.white};
  }

  @media ${device.mobileL} {
    width: 100%;
  }
`;

const LoaderWrapper = styled.div`
  padding: 48px;
`;

// Design: the pair is centred on the 499 frame and stacked full width on the
// 361 one — an outlined Atšaukti above a black Ištrinti, not a red pill.
const PopupActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;

  @media ${device.mobileL} {
    flex-direction: column;
  }
`;

const popupButton = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 126px;
  height: 40px;
  border-radius: 54px;
  ${font('base')};
  cursor: pointer;

  @media ${device.mobileL} {
    width: 100%;
  }
`;

const CancelButton = styled.button`
  ${popupButton};
  padding: 7px 11px;
  border: 1px solid ${({ theme }) => theme.colors.grey[600]};
  background: #fafafa;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ConfirmButton = styled.button`
  ${popupButton};
  padding: 8px 24px;
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;
