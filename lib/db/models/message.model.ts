import mongoose, { Schema, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    socketId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt automáticos
  }
);

// Index for querying recent messages efficiently
messageSchema.index({ createdAt: -1 });

export type IMessage = InferSchemaType<typeof messageSchema>;

export const Message =
  mongoose.models.Message ?? mongoose.model("Message", messageSchema);
