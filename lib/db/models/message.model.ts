import mongoose, { Schema, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    game: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt automáticos
  }
);

messageSchema.index({ game: 1, createdAt: -1 });

export type IMessage = InferSchemaType<typeof messageSchema>;

export const Message =
  mongoose.models.Message ?? mongoose.model("Message", messageSchema);
