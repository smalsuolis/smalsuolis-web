import { flow } from 'lodash';
import { AppType } from './constants';

import { Frequency } from './constants';
import { subMonths, subWeeks, subDays } from 'date-fns/fp';
import { formatDateAndTime, formatDateFrom, formatDateTo, formatToZonedDate } from './functions';
import { FeatureCollection } from '@aplinkosministerija/design-system';

export interface App {
  id: number;
  key: AppType;
  name: string;
  description: string;
  icon: string;
}

export interface Subscription<T = number> {
  id: number;
  name: string;
  user?: number;
  apps?: T[];
  geom?: FeatureCollection;
  frequency?: Frequency;
  active?: boolean;
  eventsCount?: { allTime: number; new: number };
}

export interface SubscriptionForm extends Subscription {
  futureApps: boolean;
  apps: number[];
  frequency: Frequency;
  active: boolean;
}

export interface Event {
  id?: string;
  externalId?: any;
  body?: any;
  createdAt: Date;
  geom: any;
  startAt: string;
  endAt?: string;
  isFullDay: boolean;
  name: string;
  url?: string;
  app: App;
}

export interface User {
  id?: string;
  email?: string;
}

export interface PasswordForm {
  password: string;
  repeatPassword: string;
  oldPassword?: string;
}

export interface UpdatePassword {
  password: string;
  oldPassword: string;
}

export interface SetPassword {
  password: string;
}

export interface ReactQueryError {
  response: {
    data: {
      type: string;
      message: string;
    };
  };
}

export interface LoginForm {
  email: string;
  password: string;
  refresh: boolean;
}

// ---- Filters ----

export enum TimeRanges {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  FUTURE = 'FUTURE',
  CUSTOM = 'CUSTOM',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_28_DAYS = 'LAST_28_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  LAST_365_DAYS = 'LAST_365_DAYS',
}

export interface TimeRangeItem {
  key: TimeRanges;
  query: any;
  name: string;
}

export const timeRangeQuery = {
  [TimeRanges.FUTURE]: {
    $gte: flow(formatToZonedDate, formatDateAndTime)(new Date()),
  },
  [TimeRanges.DAY]: {
    $gte: flow(formatDateFrom, formatDateAndTime)(new Date()),
    $lt: flow(formatDateTo, formatDateAndTime)(new Date()),
  },
  [TimeRanges.WEEK]: {
    $gte: flow(formatDateFrom, subWeeks(1), formatDateAndTime)(new Date()),
    $lt: flow(formatDateTo, formatDateAndTime)(new Date()),
  },
  [TimeRanges.MONTH]: {
    $gte: flow(formatDateFrom, subMonths(1), formatDateAndTime)(new Date()),
    $lt: flow(formatDateTo, formatDateAndTime)(new Date()),
  },
  [TimeRanges.CUSTOM]: {
    $gte: flow(formatDateFrom, formatDateAndTime)(new Date()),
    $lt: flow(formatDateTo, formatDateAndTime)(new Date()),
  },
  [TimeRanges.LAST_7_DAYS]: {
    $gte: flow(formatDateFrom, subDays(7), formatDateAndTime)(new Date()),
    $lt: flow(formatDateTo, formatDateAndTime)(new Date()),
  },
  [TimeRanges.LAST_28_DAYS]: {
    $gte: flow(formatDateFrom, subDays(28), formatDateAndTime)(new Date()),
    $lt: flow(formatDateTo, formatDateAndTime)(new Date()),
  },
  [TimeRanges.LAST_90_DAYS]: {
    $gte: flow(formatDateFrom, subDays(90), formatDateAndTime)(new Date()),
    $lt: flow(formatDateTo, formatDateAndTime)(new Date()),
  },
  [TimeRanges.LAST_365_DAYS]: {
    $gte: flow(formatDateFrom, subDays(365), formatDateAndTime)(new Date()),
    $lt: flow(formatDateTo, formatDateAndTime)(new Date()),
  },
};

export const timeRangeItems: TimeRangeItem[] = [
  {
    key: TimeRanges.DAY,
    query: timeRangeQuery[TimeRanges.DAY],
    name: 'Šios dienos',
  },
  {
    key: TimeRanges.WEEK,
    query: timeRangeQuery[TimeRanges.WEEK],
    name: 'Šios savaitės',
  },
  {
    key: TimeRanges.MONTH,
    query: timeRangeQuery[TimeRanges.MONTH],
    name: 'Šio mėnesio',
  },
  {
    key: TimeRanges.FUTURE,
    query: timeRangeQuery[TimeRanges.FUTURE],
    name: 'Būsimi',
  },
  {
    key: TimeRanges.CUSTOM,
    query: timeRangeQuery[TimeRanges.CUSTOM],
    name: 'Pasirinkite datą',
  },
];

export const statsTimeRangeItems: TimeRangeItem[] = [
  {
    key: TimeRanges.LAST_7_DAYS,
    query: timeRangeQuery[TimeRanges.LAST_7_DAYS],
    name: 'Paskutinės 7 dienos',
  },
  {
    key: TimeRanges.LAST_28_DAYS,
    query: timeRangeQuery[TimeRanges.LAST_28_DAYS],
    name: 'Paskutinės 28 dienos',
  },
  {
    key: TimeRanges.LAST_90_DAYS,
    query: timeRangeQuery[TimeRanges.LAST_90_DAYS],
    name: 'Paskutinės 90 dienų',
  },
  {
    key: TimeRanges.LAST_365_DAYS,
    query: timeRangeQuery[TimeRanges.LAST_365_DAYS],
    name: 'Paskutinės 365 dienos',
  },
  {
    key: TimeRanges.CUSTOM,
    query: timeRangeQuery[TimeRanges.CUSTOM],
    name: 'Pasirinkite datą',
  },
];

export interface Filters {
  apps?: App[];
  subscriptions?: Subscription[];
  timeRange?: TimeRangeItem;
}

export interface Stats {
  byApp: {
    infostatyba: {
      count: number;
      byTag: Record<string, { count: number }>;
    };
    izuvinimas: {
      count: number;
    };
    miskoKirtimai: {
      count: number;
      byTag: Record<string, { count: number; area: number }>;
    };
  };
  count: number;
}

export interface LastUpdateByAppType {
  appType: string;
  lastUpdate: string | null;
  eventCount: number;
  apps: any[];
}

export interface LastUpdateResponse {
  lastGlobalUpdate: string;
  byAppType: LastUpdateByAppType[];
  apps: any[];
}
