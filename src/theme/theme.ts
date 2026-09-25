export type Season = 'winter' | 'summer';

export const base = {
  bg: '#0A0E13',
  surface: '#121921',
  surface2: '#18222D',
  surface3: '#1F2B38',
  border: '#263342',
  text: '#EEF3F8',
  textDim: '#94A3B4',
  textMute: '#627284',
  blue: '#3D9BFF',
  green: '#3CBF73',
  danger: '#FF6B6B',
  warning: '#F2B84B',
};

export const seasonPalette: Record<Season, { accent: string; accentSoft: string; accentText: string; sky: [string, string]; ridge: string; ridge2: string; label: string }> = {
  winter: {
    accent: '#3D9BFF',
    accentSoft: 'rgba(61,155,255,0.14)',
    accentText: '#8EC5FF',
    sky: ['#0F2236', '#0A0E13'],
    ridge: '#1C3550',
    ridge2: '#E8F1FA',
    label: 'Зима',
  },
  summer: {
    accent: '#3CBF73',
    accentSoft: 'rgba(60,191,115,0.14)',
    accentText: '#8FE0B0',
    sky: ['#0F2A1E', '#0A0E13'],
    ridge: '#1B3A2A',
    ridge2: '#9FB7A6',
    label: 'Лето',
  },
};

export type Tier = 'bronze' | 'silver' | 'gold' | 'legend';

export const tierColors: Record<Tier, { main: string; dark: string; label: string }> = {
  bronze: { main: '#CD8B5C', dark: '#6B4128', label: 'Бронза' },
  silver: { main: '#C3CDD8', dark: '#56616D', label: 'Серебро' },
  gold: { main: '#F2C14E', dark: '#7A5A12', label: 'Золото' },
  legend: { main: '#B08CFF', dark: '#4A2F8A', label: 'Легенда' },
};

export const trailColors = {
  green: '#3CBF73',
  blue: '#3D9BFF',
  red: '#FF5A5A',
  black: '#DDE3EA',
};

export const radius = { s: 8, m: 14, l: 20, xl: 28 };
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
