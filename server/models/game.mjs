import mongoose from "mongoose";

export const GAME_TYPES = [
  "linea_horizontal",
  "linea_vertical",
  "diagonal",
  "4_esquinas",
  "marco_completo",
  "carton_lleno",
];

export const GAME_STATUSES = ["waiting", "playing", "finished"];

// Esquema de registro de ganador por ronda
const winnerSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    playerName: {
      type: String,
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    wonAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      required: true,
      enum: GAME_TYPES,
    },
    status: {
      type: String,
      enum: GAME_STATUSES,
      default: "waiting",
    },
    // Token persistente del administrador/creador
    adminToken: {
      type: String,
      required: true,
    },
    // Socket ID actual del administrador (se actualiza al reconectarse)
    adminSocketId: {
      type: String,
      default: null,
    },
    // Ronda actual (se incrementa al reiniciar)
    round: {
      type: Number,
      default: 1,
    },
    calledNumbers: {
      type: [Number],
      default: [],
    },
    // Historial de ganadores por ronda
    winners: {
      type: [winnerSchema],
      default: [],
    },
  },
  { timestamps: true }
);

gameSchema.index({ status: 1 });
gameSchema.index({ createdAt: -1 });

export const Game =
  mongoose.models.Game ?? mongoose.model("Game", gameSchema);
