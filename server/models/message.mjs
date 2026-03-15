import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, maxlength: 500, trim: true },
    socketId: { type: String, required: true },
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: -1 });

export const Message =
  mongoose.models.Message ?? mongoose.model("Message", messageSchema);
