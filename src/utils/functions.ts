import {
  format,
  isToday,
  parseISO,
  endOfDay,
  startOfDay,
  isTomorrow,
  isYesterday,
  isSameDay,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { toast } from 'react-toastify';
import { validationTexts } from './texts';
import { Event } from './types';

export const getErrorMessage = (error?: string) =>
  validationTexts[error as keyof typeof validationTexts] || validationTexts.error;

// One set of options for every toast; the look itself lives in GlobalStyle.
const TOAST_OPTIONS = {
  position: 'top-center',
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
} as const;

export const handleAlert = (responseError?: string) => {
  toast.error(getErrorMessage(responseError), TOAST_OPTIONS);
};

export const handleToastError = (message: string) => {
  toast.error(message, TOAST_OPTIONS);
};

export const handleToastSuccess = (message: string) => {
  toast.success(message, TOAST_OPTIONS);
};

export const formatDate = (date?: Date | string) =>
  date ? format(new Date(date), 'yyyy-MM-dd') : '';

export const formatDateAndTime = (date?: Date | string) =>
  date ? format(new Date(date), 'yyyy-MM-dd HH:mm') : '';

export const formatTime = (date?: Date | string) => (date ? format(new Date(date), 'HH:mm') : '');

function getDateTranslate(date: Date) {
  if (isToday(date)) return 'Šiandien';
  else if (isTomorrow(date)) return 'Rytoj';
  else if (isYesterday(date)) return 'Vakar';
}

export const getTimeLabel = ({ startAt, endAt, isFullDay }: Event) => {
  function getFormatted(value?: string) {
    if (!value) return;

    const parsedValue = parseISO(value);

    const prefix = getDateTranslate(parsedValue);
    if (isFullDay) return prefix ? prefix : formatDate(parsedValue);
    else if (prefix) return `${prefix} ${formatTime(parsedValue)}`;
    return formatDateAndTime(parsedValue);
  }

  const startAtFormatted = getFormatted(startAt);
  const endAtFormatted = getFormatted(endAt);

  if (endAtFormatted) {
    return `${startAtFormatted} - ${endAtFormatted}`;
  }

  return startAtFormatted;
};

export const isEmpty = (value: any) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  );
};

export const formatDateTo = (date: Date) => {
  return toZonedTime(endOfDay(date), 'Europe/Vilnius');
};

export const formatDateFrom = (date: Date) => {
  return toZonedTime(startOfDay(new Date(date)), 'Europe/Vilnius');
};

export const formatToZonedDate = (date: Date) => {
  return toZonedTime(new Date(date), 'Europe/Vilnius');
};

export const displayCustomDateFilterLabel = (date: { start?: Date; end?: Date } | undefined) => {
  if (!date?.start) {
    return '-';
  }
  const start = new Date(date.start);
  const end = date.end && new Date(date.end);
  if (!end || isSameDay(start, end)) {
    return `${format(start, 'yyyy-MM-dd')}`;
  } else {
    return `${format(start, 'yyyy-MM-dd')}  -  ${format(end, 'yyyy-MM-dd')}`;
  }
};

export const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) {
    return 'Nėra duomenų';
  }

  const date = parseISO(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Šiandien';
  } else if (diffInDays === 1) {
    return 'Vakar';
  } else if (diffInDays < 7) {
    return `Prieš ${diffInDays} d.`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `Prieš ${weeks} sav.`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `Prieš ${months} mėn.`;
  } else {
    return formatDate(date);
  }
};

export const calculatePreviousPeriod = (query: { $gte: string; $lt: string }) => {
  const gte = new Date(query.$gte);
  const lt = new Date(query.$lt);

  const diffInMs = lt.getTime() - gte.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  const previousGte = new Date(gte.getTime() - diffInDays * 24 * 60 * 60 * 1000);
  const previousLt = new Date(lt.getTime() - diffInDays * 24 * 60 * 60 * 1000);

  return {
    $gte: previousGte.toISOString(),
    $lt: previousLt.toISOString(),
  };
};

export const getUpdateStatusColor = (dateString: string | null): string => {
  if (!dateString) {
    return '#EF4444'; // red
  }

  const date = parseISO(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 7) {
    return '#10B981'; // green
  } else if (diffInDays < 30) {
    return '#F59E0B'; // yellow/orange
  } else {
    return '#EF4444'; // red
  }
};

/**
 * The filters one surface hands to the other when the reader switches view.
 *
 * The map and the feed name the same things differently — `app` against `apps`
 * — and used to speak different period vocabularies too, so a selection could
 * not survive the trip. The periods are one list now, so only the names need
 * translating.
 *
 * Address is deliberately left behind: the feed has nowhere to show it, and the
 * map keeps its own.
 */
export const viewHandoffParams = (
  target: 'map' | 'list',
  filters: {
    appIds?: number[];
    categoryIds?: number[];
    rangeKey?: string;
    customRange?: { $gte: string; $lt: string };
  },
): URLSearchParams => {
  const params = new URLSearchParams();
  const { appIds = [], categoryIds = [], rangeKey, customRange } = filters;

  if (appIds.length) params.set(target === 'map' ? 'app' : 'apps', appIds.join(','));
  if (categoryIds.length) params.set('categories', categoryIds.join(','));
  if (rangeKey) params.set('range', rangeKey);
  // A custom range travels as the dates themselves; the key alone means nothing
  // on the other side.
  if (customRange?.$gte && customRange?.$lt) {
    params.set('from', customRange.$gte);
    params.set('to', customRange.$lt);
  }
  if (target === 'list') params.set('view', 'list');
  return params;
};
