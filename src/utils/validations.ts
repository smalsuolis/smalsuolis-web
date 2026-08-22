import * as Yup from 'yup';
import { Frequency } from './constants';
import { validationTexts } from './texts';

export const loginSchema = Yup.object().shape({
  email: Yup.string().required(validationTexts.requireText).email(validationTexts.badEmailFormat),
  password: Yup.string().required(validationTexts.requireText),
});
export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().required(validationTexts.requireText).email(validationTexts.badEmailFormat),
  agree: Yup.bool().oneOf([true]),
});
export const validateSubscriptionForm = Yup.object().shape({
  name: Yup.string().required(validationTexts.requireText).min(1),
  // An empty list is a valid subscription while the automatic toggle is on: the
  // API reads "no apps" as "every app, including ones added later".
  apps: Yup.array()
    .of(Yup.number())
    .when('futureApps', {
      is: true,
      then: (schema) => schema,
      otherwise: (schema) => schema.min(1, validationTexts.appsNotSelected),
    }),
  geom: Yup.object().required(validationTexts.requireText),
  frequency: Yup.mixed().oneOf(Object.values(Frequency)).required(validationTexts.requireText),
});
