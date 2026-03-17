import 'styled-components';
import { Theme } from '@aplinkosministerija/design-system';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
