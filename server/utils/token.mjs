import { randomUUID } from "node:crypto";

/**
 * Genera un token único para identificar sesiones persistentes.
 */
export function generateToken() {
  return randomUUID();
}
