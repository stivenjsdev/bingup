import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    // Token persistente del jugador (sobrevive reconexiones)
    token: {
      type: String,
      required: true,
    },
    // Socket ID actual (se actualiza al reconectarse)
    socketId: {
      type: String,
      default: null,
    },
    card: {
      type: [[Number]],
      required: true,
    },
    markedNumbers: {
      type: [Number],
      default: [],
    },
    // Estado de conexión del jugador
    online: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

playerSchema.index({ game: 1 });
playerSchema.index({ token: 1 });
playerSchema.index({ socketId: 1 });

export const Player =
  mongoose.models.Player ?? mongoose.model("Player", playerSchema);
