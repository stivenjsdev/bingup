export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

export const BINGO_COLUMN_COLORS = ['#1565c0', '#c62828', '#2e7d32', '#f57f17', '#6a1b9a'];

export const GAME_TYPE_LABELS: Record<string, string> = {
  linea_horizontal: 'Línea horizontal',
  linea_vertical: 'Línea vertical',
  diagonal: 'Diagonal',
  '4_esquinas': '4 Esquinas',
  marco_completo: 'Marco completo',
  carton_lleno: 'Cartón lleno',
};

export const STATUS_MAP: Record<
  string,
  { label: string; color: 'warning' | 'success' | 'info' }
> = {
  waiting: { label: 'En espera', color: 'warning' },
  playing: { label: 'En curso', color: 'success' },
  finished: { label: 'Finalizada', color: 'info' },
};

export const WIN_PATTERNS: Record<string, boolean[][]> = {
  linea_horizontal: [
    [true, true, true, true, true],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
  ],
  linea_vertical: [
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
  ],
  diagonal: [
    [true, false, false, false, false],
    [false, true, false, false, false],
    [false, false, true, false, false],
    [false, false, false, true, false],
    [false, false, false, false, true],
  ],
  '4_esquinas': [
    [true, false, false, false, true],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, false, false, false, true],
  ],
  marco_completo: [
    [true, true, true, true, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, true],
  ],
  carton_lleno: [
    [true, true, true, true, true],
    [true, true, true, true, true],
    [true, true, true, true, true],
    [true, true, true, true, true],
    [true, true, true, true, true],
  ],
};

export const WIN_PATTERN_HINTS: Record<string, string> = {
  linea_horizontal: 'Completa cualquier fila',
  linea_vertical: 'Completa cualquier columna',
  diagonal: 'Completa cualquier diagonal',
  '4_esquinas': 'Marca las 4 esquinas',
  marco_completo: 'Marca todo el borde',
  carton_lleno: 'Marca todas las casillas',
};

export const ACTION_TIMEOUT = 3000;

/** Devuelve el color de columna para un número de bingo (1-75) */
export const getColumnColor = (num: number): string => {
  if (num >= 1 && num <= 15) return BINGO_COLUMN_COLORS[0];
  if (num >= 16 && num <= 30) return BINGO_COLUMN_COLORS[1];
  if (num >= 31 && num <= 45) return BINGO_COLUMN_COLORS[2];
  if (num >= 46 && num <= 60) return BINGO_COLUMN_COLORS[3];
  if (num >= 61 && num <= 75) return BINGO_COLUMN_COLORS[4];
  return '#666';
};

/** Devuelve la letra de columna (B/I/N/G/O) para un número de bingo */
export const getColumnLetter = (num: number): string => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};
