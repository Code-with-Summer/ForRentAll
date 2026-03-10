import mongoose from "mongoose";

const ContentSchema = new mongoose.Schema({
  type: { type: String, enum: ["text", "image"], required: true },
  text: String,
  image: String
}, { _id: false });

const BlogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: [ContentSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("BlogPost", BlogPostSchema);
