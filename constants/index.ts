import { type GlobalThemeOverrides } from 'naive-ui'

export const NOTE_NOT_FOUND = 'note not exist!'
export const TOKEN_EXPIRED = 'token expired'

export const MOBILE_THEME: GlobalThemeOverrides & { defaults: boolean } = {
  common: {
    fontSize: '12px'
  },
  Card: {
    paddingMedium: '8px',
    paddingSmall: '8px',
    fontSizeMedium: '12px',
    fontSizeSmall: '12px',
    titleFontSizeMedium: '16px'
  },
  Button: {
    fontSizeMedium: '12px',
    paddingMedium: '8px',
    iconSizeMedium: '14px',
    iconSizeLarge: '16px',
    heightMedium: '28px'
  },
  Input: {
    fontSizeMedium: '12px',
    paddingMedium: '8px',
    iconSize: '14px',
    heightMedium: '28px'
  },
  Tabs: {
    tabFontSizeMedium: '12px'
  },
  Tag: {
    fontSizeSmall: '10px',
    fontSizeTiny: '10px',
    heightTiny: '16px',
    heightSmall: '18px'
  },
  List: {
    fontSize: '14px'
  },
  defaults: false,
}