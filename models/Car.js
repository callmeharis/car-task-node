const mongoose = require("mongoose");

const CarSchema = new mongoose.Schema(
  {
    carModel: {
      type: String,
      required: [true, "Please provide company name"],
      minlength: [3, "Your model must have minimum 3 letters"],
    },
    price: {
      type: Number,
      required: [true, "Please provide price"],
    },
    phone: {
      type: String,
      required: [true, "Please provide price"],
      match: [/^\d{11}$/, "Phone number must be exactly 11 digits"],
    },
    carImage: {
      type: [String],
      // required: true,
    },

    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", CarSchema);
