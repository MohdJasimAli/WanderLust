const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});



// passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
