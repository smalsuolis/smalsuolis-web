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

export interface Category {
  id: number;
  code: string;
  name: string;
  parent: number | null;
  appType: string;
  sort: number;
  hidden?: boolean;
}

export interface Subscription<T = number> {
  id: number;
  name: string;
  user?: number;
  apps?: T[];
  categories?: number[];
  geom?: FeatureCollection;
  frequency?: Frequency;
  active?: boolean;
  textFilter?: string;
  eventsCount?: { allTime: number; new: number };
}

export interface SubscriptionForm extends Subscription {
  futureApps: boolean;
  apps: number[];
  categories: number[];
  frequency: Frequency;
  textFilter?: string;
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
  category?: Category;
}

// A single event returned by the /events/near lookup (a lightweight row, not
// the full Event — enough for the map popup's recent-events list).
export interface NearEvent {
  id: string;
  name: string;
  startAt: string;
  url?: string;
  appId?: number;
  appName?: string;
  appKey?: string;
}

// Response of the /events/near lookup: total events in the radius + the most
// recent few, for the map's address popup.
export interface EventsNearResponse {
  count: number;
  radius: number;
  events: NearEvent[];
}

// Address autocomplete suggestion from the boundaries registry (via the API's
// /addresses/suggest endpoint). `geometry` is a GeoJSON Point in EPSG:4326.
export interface AddressSuggestion {
  code: number;
  label: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
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
  ALL_TIME = 'ALL_TIME',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_28_DAYS = 'LAST_28_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  LAST_365_DAYS = 'LAST_365_DAYS',
}

export interface TimeRangeItem {
  key: string;
  query: any;
  name: string;
}

export const firstDataYear = 2023;

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
  [TimeRanges.ALL_TIME]: {
    $gte: '2000-01-01 00:00',
    $lt: '2099-12-31 23:59',
  },
};

export const yearQuery = (year: number): { $gte: string; $lt: string } => ({
  $gte: `${year}-01-01 00:00`,
  $lt: `${year}-12-31 23:59`,
});

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
    key: TimeRanges.ALL_TIME,
    query: timeRangeQuery[TimeRanges.ALL_TIME],
    name: 'Visi laikai',
  },
  {
    key: TimeRanges.CUSTOM,
    query: timeRangeQuery[TimeRanges.CUSTOM],
    name: 'Pasirinkite datą',
  },
];

/**
 * What every surface opens on.
 *
 * The map used to open on the last 28 days while the filter beside it counted
 * every event, so the same screen showed 76 pins next to a count of 12,513 and
 * nothing said why. Opening on everything and letting the reader narrow is the
 * honest way round.
 */
export const defaultTimeRange: TimeRangeItem = timeRangeItems.find(
  (i) => i.key === TimeRanges.ALL_TIME,
)!;

const currentYear = new Date().getFullYear();
const yearItems: TimeRangeItem[] = Array.from(
  { length: currentYear - firstDataYear + 1 },
  (_, i) => {
    const year = currentYear - i;
    return { key: String(year), query: yearQuery(year), name: String(year) };
  },
);

/**
 * Statistics offers the same periods as everywhere else, plus whole years.
 *
 * The three surfaces used to offer three different sets — rolling windows here
 * and on the map, calendar periods in the feed — so the same question was asked
 * three ways. Years stay, and only here: comparing one year with another is
 * what this page is for, and it would only lengthen a dropdown nobody opens for
 * that reason on a map.
 */
export const statsTimeRangeItems: TimeRangeItem[] = [
  ...timeRangeItems.filter((i) => i.key !== TimeRanges.CUSTOM),
  ...yearItems,
  {
    key: TimeRanges.CUSTOM,
    query: timeRangeQuery[TimeRanges.CUSTOM],
    name: 'Pasirinkite datą',
  },
];

export interface Filters {
  apps?: App[];
  subscriptions?: Subscription[];
  categories?: Category[];
  timeRange?: TimeRangeItem;
}

export interface Stats {
  byApp: {
    infostatyba: {
      count: number;
      byTag: Record<string, { count: number }>;
      byCategory?: Record<string, { count: number }>;
    };
    izuvinimas: {
      count: number;
      // Optional: the API sets byTag for any app whose events carry tags. These
      // feeds emit none today, so the card renders its total with no rows —
      // it fills in automatically if that changes.
      byTag?: Record<string, { count: number }>;
    };
    miskoKirtimai: {
      count: number;
      byTag: Record<string, { count: number; area: number }>;
    };
    zemetvarkosPlanavimas: {
      count: number;
      byTag?: Record<string, { count: number }>;
    };
    savivaldybesZemetvarka: {
      count: number;
      byTag?: Record<string, { count: number }>;
    };
  };
  // Per-municipality breakdown, keyed by municipality name. Each has a total
  // count plus a per-appType split. Feeds the "Akyviausi miestai" cards.
  byMunicipality?: Record<
    string,
    {
      count: number;
      byApp: Record<string, number>;
    }
  >;
  count: number;
}

export interface LastUpdateByAppType {
  appType: string;
  lastUpdate: string | null;
  eventCount: number;
  lastUpdateCount: number;
  apps: any[];
}

export interface LastUpdateResponse {
  lastGlobalUpdate: string;
  firstGlobalEvent: string | null;
  byAppType: LastUpdateByAppType[];
  apps: any[];
}
