const mongoose = require("mongoose");

const AnnouncementSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Başlık zorunludur"],
      trim: true,
      maxlength: [200, "Başlık en fazla 200 karakter olabilir"],
    },
    content: {
      type: String,
      required: [true, "İçerik zorunludur"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Bölüm bilgisi zorunludur"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["finals", "makeup", "normal"],
      required: [true, "Duyuru türü zorunludur"],
      default: "normal",
    },
    files: [
      {
        filename: { type: String, required: true },
        path: { type: String, required: true },
        originalname: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    secretary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Secretary",
      required: false,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Sanal alanlar veya diğer middleware'ler eklenebilir
AnnouncementSchema.virtual("fileCount").get(function () {
  return this.files.length;
});

const Announcement = mongoose.model("Announcement", AnnouncementSchema);
module.exports = Announcement;
