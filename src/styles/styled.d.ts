import 'styled-components';
import { Theme } from '@aplinkosministerija/design-system';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {
    colors: Theme['colors'] & {
      text: NonNullable<Theme['colors']['text']>;
    };
  }
}
