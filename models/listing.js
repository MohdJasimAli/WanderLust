const mongoose = require("mongoose");
const Review = require("./reviews.js");
const { Schema } = mongoose;

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    image: {
      url: {
        type: String,
        default: "https://via.placeholder.com/400x300",
      },
      filename: String,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    country: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Trending",
        "Room",
        "Artic",
        "Iconic Cities",
        "Pools",
        "Mountains",
        "Castles",
        "Campings",
        "Farms",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

// Cascade delete reviews
listingSchema.post("findOneAndDelete", async function (doc) {
  if (doc && Array.isArray(doc.reviews) && doc.reviews.length > 0) {
    await Review.deleteMany({
      _id: { $in: doc.reviews },
    });
  }
});

module.exports = mongoose.model("Listing", listingSchema);
