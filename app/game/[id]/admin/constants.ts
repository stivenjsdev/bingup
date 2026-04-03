export const GAME_TYPES = [
  { value: 'linea_horizontal', label: 'Línea horizontal' },
  { value: 'linea_vertical', label: 'Línea vertical' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: '4_esquinas', label: '4 Esquinas' },
  { value: 'marco_completo', label: 'Marco completo' },
  { value: 'carton_lleno', label: 'Cartón lleno' },
];

export const GAME_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  GAME_TYPES.map((t) => [t.value, t.label]),
);

export const STATUS_MAP: Record<
  string,
  { label: string; color: 'warning' | 'success' | 'info' }
> = {
  waiting: { label: 'En espera', color: 'warning' },
  playing: { label: 'En curso', color: 'success' },
  finished: { label: 'Finalizada', color: 'info' },
};

export const BINGO_COLUMNS = [
  { letter: 'B', min: 1, max: 15, color: '#1565c0' },
  { letter: 'I', min: 16, max: 30, color: '#c62828' },
  { letter: 'N', min: 31, max: 45, color: '#2e7d32' },
  { letter: 'G', min: 46, max: 60, color: '#f57f17' },
  { letter: 'O', min: 61, max: 75, color: '#6a1b9a' },
];

export const ACTION_TIMEOUT = 3000;

export const getColumnForNumber = (num: number) =>
  BINGO_COLUMNS.find((c) => num >= c.min && num <= c.max);
