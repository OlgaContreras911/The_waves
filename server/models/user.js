// IMPORTATIONS
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SALT_I = 10;
const jwt = require("jsonwebtoken");
require("dotenv").config();

// SCHEMA
const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true, //always
    trim: true, //no space
    unique: 1
  },
  password: {
    type: String,
    required: true,
    minlength: 5
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  lastname: {
    type: String,
    required: true,
    maxlength: 100
  },
  cart: {
    type: Array,
    default: []
  },
  history: {
    type: Array,
    default: []
  },
  role: {
    type: Number,
    default: 0 //default user=administrator
  },
  token: {
    type: String
  }
});

// MIDDLEWARE
userSchema.pre("save", async function(next) {
  //Before actually saving yhe password
  if (this.isModified("password")) {
    //Just encrypt one time, when the user is created or password modified, this is user
    try {
      const salt = await bcrypt.genSalt(SALT_I);
      const hash = await bcrypt.hash(this.password, salt);
      this.password = hash; //encrypt password
      next();
    } catch (err) {
      return next(err);
    }
  }
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  //Extending function to our schema to be executed from server
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

userSchema.methods.generateToken = async function(cb) {
  const token = await jwt.sign(this._id.toHexString(), process.env.SECRET); //convert id in string and pass to it enve.SECRET
  //hash=user.id+ password generated for this propouse
  this.token = token; //adding token to user
  this.save((err, user) => {
    //save token in user
    if (err) return cb(err);
    cb(null, user);
  });
};

userSchema.statics.findByToken = function(token, cb) {
  var user = this;

  jwt.verify(token, process.env.SECRET, function(err, decode) {
    //Check that all works OK to continue, verify decode
    user.findOne({ _id: decode, token: token }, function(err, user) {
      if (err) return cb(error);
      cb(null, user);
    });
  });
};

const User = mongoose.model("User", userSchema, "users"); // name of the model + name of the schema

module.exports = { User };
