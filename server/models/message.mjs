import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },
    content: { type: String, required: true, maxlength: 500, trim: true },
  },
  { timestamps: true }
);

messageSchema.index({ game: 1, createdAt: -1 });

export const Message =
  mongoose.models.Message ?? mongoose.model("Message", messageSchema);
