import { createGlobalStyle, css } from 'styled-components';
import { Theme } from '@aplinkosministerija/design-system';

export enum ButtonVariants {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  DANGER = 'danger',
  TRANSPARENT = 'transparent',
}

export const theme: Theme = {
  colors: {
    primary: '#73DC8C',
    secondary: '#121A55',
    tertiary: '#1B4C28',
    transparent: 'transparent',
    label: '#4B5565',
    danger: '#FE5B78',
    success: '#258800',
    powder: '#FFFFFFCC',
    purple: '#8a33fe',
    purpleBrighter: '#b020a2',
    yellow: '#ffb400',
    yellowDarker: '#ffd399',
    greyDarker: '#d4d5de',
    lightSteelBlue: '#cdd5df',
    buttons: {
      [ButtonVariants.PRIMARY]: {
        background: '#73DC8C',
        text: '#101010',
        border: '#73DC8C',
        // Name the hover, or the design system paints its stock light blue over
        // the brand green. Only the fill moves — the label keeps its colour.
        hover: '#6ED386',
        hoverBorder: '#6ED386',
        hoverText: '#101010',
      },
      [ButtonVariants.SECONDARY]: {
        background: 'white',
        text: '#101010',
        border: 'white',
        hover: '#121A55',
        hoverText: 'white',
      },
      [ButtonVariants.TERTIARY]: {
        background: '#14532D',
        text: 'white',
        border: '#14532D',
        hover: '#14532D',
      },
      [ButtonVariants.DANGER]: {
        background: '#FE5B78',
        text: 'white',
        border: '#FE5B78',
        hover: '#FE5B78E6',
      },
      [ButtonVariants.TRANSPARENT]: {
        background: 'transparent',
        text: '#101010',
        border: 'transparent',
      },
    },
    text: {
      primary: '#000000',
      secondary: '#525252',
      tertiary: '#4B5565',
      label: '#697586',
      error: '#EF4444',
      labels: '#697586',
      input: '#231f20',
      accent: '#102EB1',
      powder: '#FFFFFFCC',
      retroBlack: '#101010',
      royalBlue: '#1121DA',
    },
    border: '#CDD5DF',
    background: '#f7f7f7',
    cardBackground: { primary: '#f7f7f7', success: '#eafbf6' },
    GREY: '#f7f7f7',
    // Grey ramp from the new design system (Figma MVP file).
    grey: {
      300: '#DDDDDD',
      400: '#D6D6D6',
      500: '#BCBCBC',
      550: '#818181',
      600: '#707070',
      /* Flattened #000 at the 64% the design applies to muted footer copy. */
      650: '#5C5C5C',
      700: '#333333',
    },
    black: '#000000',
    white: '#FFFFFF',
  },
  radius: {
    buttons: 100,
    fields: 0,
    multiSelectFieldTag: 0,
  },
  height: {
    fields: 0,
    buttons: 0,
  },
  fontSize: {
    fields: 0,
    fieldLabels: 0,
    buttons: 0,
  },
  fontWeight: {
    fields: 0,
    fieldLabels: 0,
    buttons: 0,
  },
};

/**
 * Type scale from the new design (Figma MVP file). Values map the Figma
 * `text-*` styles: [fontSize(px), lineHeight(unitless), fontWeight, letterSpacing(em)].
 * Rendered in rem via the 62.5% html base (1rem = 10px), so 16px => 1.6rem.
 */
export const typography = {
  '6xl': { size: 6.4, lineHeight: 1.2, weight: 700, tracking: '-0.05em' },
  '5xl': { size: 4.8, lineHeight: 1.5, weight: 400, tracking: '-0.05em' },
  '3xl': { size: 3.0, lineHeight: 1.3, weight: 500, tracking: '-0.05em' },
  '2xl': { size: 2.4, lineHeight: 1.3, weight: 500, tracking: '-0.02em' },
  xl: { size: 2.0, lineHeight: 1.5, weight: 400, tracking: '-0.02em' },
  lg: { size: 1.8, lineHeight: 1.5, weight: 400, tracking: '-0.02em' },
  base: { size: 1.6, lineHeight: 1.5, weight: 400, tracking: '-0.02em' },
  sm: { size: 1.4, lineHeight: 1.5, weight: 400, tracking: '-0.02em' },
} as const;

export type TypographyToken = keyof typeof typography;

/** styled-components css mixin for a given type token. */
export const font = (token: TypographyToken, weight?: number) => {
  const t = typography[token];
  return css`
    font-size: ${t.size}rem;
    line-height: ${t.lineHeight};
    font-weight: ${weight ?? t.weight};
    letter-spacing: ${t.tracking};
  `;
};

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  html {
    font-size: 62.5%;
    width: 100vw;
    color: ${theme.colors.text?.primary};
  }
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    /* Figma frames are white; colors.background (#f7f7f7) stays the light
       surface used for hover/active fills, so it can't double as the page. */
    background-color: ${theme.colors.white};
    font-size: 1.6rem;
    overflow: hidden;
    justify-content: center;
  }
  h1 {
    font-size: 3.2rem;
    color: ${theme.colors.text?.primary};
  }
  a {
    text-decoration: none;
    color: inherit;
    :hover {
      color: inherit;
    }
  }
  button {
    outline: none;
    text-decoration: none;
    display: block;
    border: none;
    background-color: transparent;
  }

  textarea {
    font-size: 1.6rem;
  }

  /* The design-system modal paints a navy backdrop; the design uses a neutral
     40% black. Marked cards opt in via data-modal-card. */
  div:has(> [data-modal-card]) {
    background: rgba(11, 11, 11, 0.4);
  }

  /* The design's toggle track is #1FC84C on and #D9D9D9 off; the design system
     paints it in the app's primary green. Matches the Switch's own markup
     (label > input + span), not the checkbox's. */
  /* The repeated attribute selector is deliberate: the design system's own
     rule is three classes deep, and a single one loses the cascade. */
  label > input[type='checkbox'][type='checkbox'] + span {
    background-color: #d9d9d9;
  }
  label > input[type='checkbox'][type='checkbox']:checked + span {
    background-color: #1fc84c;
  }
  label > input[type='checkbox'][type='checkbox'] + span::after {
    width: 20px;
    height: 20px;
    top: 2px;
    left: 2px;
  }
  label > input[type='checkbox'][type='checkbox']:checked + span::after {
    left: 22px;
  }

  /* Toasts: the design's 52px pill — tinted background, the matching glyph, and
     an accent bar down the right edge. react-toastify's own icon and close
     button are replaced rather than restyled. */
  .Toastify__toast {
    min-height: 52px;
    padding: 0;
    border-radius: 6px;
    font-family: inherit;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
  }
  .Toastify__toast-body {
    align-items: center;
    gap: 12px;
    margin: 0;
    padding: 16px;
    font-size: 1.4rem;
    line-height: 2rem;
    font-weight: 500;
  }
  .Toastify__toast-body > div:last-child {
    flex: 1;
  }
  .Toastify__close-button {
    display: none;
  }
  .Toastify__toast-icon {
    width: 20px;
    height: 20px;
    margin: 0;
    flex-shrink: 0;
    background: center / 20px 20px no-repeat;
  }
  .Toastify__toast-icon > * {
    display: none;
  }
  .Toastify__toast--success {
    background: #f3fbf7;
    color: #1b7b35;
    border-right: 4px solid #1b7b35;
  }
  .Toastify__toast--success .Toastify__toast-icon {
    background-image: url('/icons/toast_success.svg');
  }
  .Toastify__toast--error {
    background: #fef2f2;
    color: #b91c1c;
    border-right: 4px solid #b91c1c;
  }
  .Toastify__toast--error .Toastify__toast-icon {
    background-image: url('/icons/toast_error.svg');
  }
`;

/**
 * Site content column, as an OUTER width to pair with the standard 32px side
 * padding: the Figma frames are 1440 wide with 56px gutters, so the content
 * itself measures 1328. Adding 2x32 padding on top gives 1392, which keeps the
 * inner edge at x=56 on a 1440 viewport.
 */
export const CONTENT_WIDTH = '1392px';

export const device = {
  mobileS: `(max-width: 320px)`,
  mobileM: `(max-width: 425px)`,
  mobileL: `(max-width: 868px)`,
  tablet: `(max-width: 1280px)`,
  desktop: `(min-width: 869px)`,
};

/**
 * The design-system CheckBox draws its tick via a ::after on an inner 14px
 * label offset `left: 2px` inside an 18px box, starting at `left: 1px`. After
 * the -45deg rotation the glyph ends up crowding the box's right edge. Shifting
 * it a pixel left re-centres it. Apply to any container that renders a DS
 * CheckBox.
 */
export const checkmarkNudge = css`
  label::after {
    left: 0px;
  }
`;

/**
 * Hover tint for the borderless list rows (events, subscriptions). The design
 * gives those rows no horizontal padding, so tinting the element itself hugs
 * the text; this paints the tint on a layer that bleeds 16px past the content
 * instead. `bottomBleed` is the row's own bottom padding minus that 16px, so
 * the tint clears the divider. Children paint above it — they are positioned.
 */
export const rowHoverTint = (bottomBleed: string) => css`
  position: relative;

  > * {
    position: relative;
  }

  &::before {
    content: '';
    position: absolute;
    inset: -16px -16px ${bottomBleed};
    border-radius: 16px;
    background: transparent;
    transition: background 0.15s ease;
  }

  &:hover::before {
    background: ${({ theme }) => theme.colors.background};
  }
`;
