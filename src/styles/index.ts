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
      primary: '#101010',
      secondary: '#525252',
      tertiary: '#4B5565',
      label: '#697586',
      error: '#FE5B78',
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
      600: '#707070',
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
    background-color: ${theme.colors.background};
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
