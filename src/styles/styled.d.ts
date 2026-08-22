import 'styled-components';
import { Theme } from '@aplinkosministerija/design-system';

type GreyRamp = {
  300: string;
  400: string;
  500: string;
  600: string;
  650: string;
  700: string;
};

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {
    colors: Theme['colors'] & {
      text: NonNullable<Theme['colors']['text']>;
      grey: GreyRamp;
      black: string;
      white: string;
    };
  }
}
