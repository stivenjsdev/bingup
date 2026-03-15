/**
 * Genera un cartón de Bingo estándar de 5x5.
 *
 * Rangos por columna (Bingo americano estándar):
 *   B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
 *
 * La casilla central (fila 2, col 2) es el espacio LIBRE representado por 0.
 *
 * Retorna una matriz 5x5 (arreglo de 5 arreglos, cada uno con 5 números).
 */
export function generateCard() {
  const ranges = [
    [1, 15], // B
    [16, 30], // I
    [31, 45], // N
    [46, 60], // G
    [61, 75], // O
  ];

  const card = ranges.map(([min, max], colIndex) => {
    const pool = [];
    for (let n = min; n <= max; n++) {
      pool.push(n);
    }

    // Mezcla Fisher-Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const column = pool.slice(0, 5);

    // Espacio libre en el centro (columna N, fila 2)
    if (colIndex === 2) {
      column[2] = 0;
    }

    return column;
  });

  // Transponer para que card[fila][col] en vez de card[col][fila]
  const rows = [];
  for (let r = 0; r < 5; r++) {
    rows.push(card.map((col) => col[r]));
  }

  return rows;
}

/**
 * Verifica si un cartón cumple la condición de victoria según el tipo de juego.
 *
 * @param {number[][]} card - Cartón 5x5 del jugador
 * @param {number[]} markedNumbers - Números marcados por el jugador
 * @param {string} gameType - Tipo de juego
 * @returns {boolean}
 */
export function checkWin(card, markedNumbers, gameType) {
  const marked = new Set(markedNumbers);

  // El centro (0) siempre se considera marcado (espacio libre)
  const isMarked = (row, col) => card[row][col] === 0 || marked.has(card[row][col]);

  switch (gameType) {
    case "linea_horizontal":
      // Cualquier fila completa
      for (let r = 0; r < 5; r++) {
        if (card[r].every((_, c) => isMarked(r, c))) return true;
      }
      return false;

    case "linea_vertical":
      // Cualquier columna completa
      for (let c = 0; c < 5; c++) {
        if ([0, 1, 2, 3, 4].every((r) => isMarked(r, c))) return true;
      }
      return false;

    case "diagonal":
      // Diagonal principal o diagonal inversa
      const diag1 = [0, 1, 2, 3, 4].every((i) => isMarked(i, i));
      const diag2 = [0, 1, 2, 3, 4].every((i) => isMarked(i, 4 - i));
      return diag1 || diag2;

    case "4_esquinas":
      // Las 4 esquinas del cartón
      return isMarked(0, 0) && isMarked(0, 4) && isMarked(4, 0) && isMarked(4, 4);

    case "marco_completo":
      // Todo el borde del cartón (fila 0, fila 4, columna 0, columna 4)
      for (let i = 0; i < 5; i++) {
        if (!isMarked(0, i)) return false; // fila superior
        if (!isMarked(4, i)) return false; // fila inferior
        if (!isMarked(i, 0)) return false; // columna izquierda
        if (!isMarked(i, 4)) return false; // columna derecha
      }
      return true;

    case "carton_lleno":
      // Todas las casillas marcadas
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (!isMarked(r, c)) return false;
        }
      }
      return true;

    default:
      return false;
  }
}
