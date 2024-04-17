const mongoose = require('mongoose'); // ODM for MongoDB
const bcrypt = require('bcryptjs'); // For hashing passwords
const validator = require('validator'); // Validating schema constraints
const speakeasy = require('speakeasy'); // For 2FA

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your full name']
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username must be less than 30 characters long']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Username must be at least 3 characters long'],
    select: false,
    validate: {
      validator: function (v) {
        return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/m.test(v);
      },
      message: 'Password must include at least one lowercase letter, one uppercase letter, and a digit.'
    }
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    validate: {
      validator: function (v) {
        return /\d{10}/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  otpVerified: {
    type: Boolean,
    default: false
  },
  numberVerificationOtp: Number,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  lastLoginAt: Date,
  failedLoginAttempts: [{
    attemptDate: { type: Date, default: Date.now },
    ipAddress: { type: String, required: true },
    systemInfo: {
      os: { type: String, required: false },
      browser: { type: String, required: false }
    }
  }],
  accountLockedUntil: Date,
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  roles: [{
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }],
  userType: {
    type: String,
    required: [true, 'Please specify the user type'],
    enum: ['professional', 'partner']
  },
  profileImage: String,
  gender: [{
    type: String,
    enum: ['male', 'female', 'other']
  }],
  birthdate: {
    type: Date,
    required: [true, 'Please provide your date of birth'],
    validate: {
      validator: function (value) {
        const today = new Date();
        const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        const maxAgeDate = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());

        // Check if the birthdate is between 18 and 80 years ago
        return value >= maxAgeDate && value <= minAgeDate;
      },
      message: 'You must be at least 18 and not older than 80 years old'
    }
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  profileCompletion: Boolean,
  twoFactorSecret: String,
  sessions: [{
    token: String,
    createdAt: Date
  }],
  refreshTokens: [{
    token: String,
    expiresAt: Date
  }],
  socialAccounts: {
    googleId: String
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  loginHistory: [{
    loggedInAt: Date,
    ip: String,
    device: String
  }]

}, { timestamps: true });

// Middleware for password hashing
userSchema.pre('save', async function (next) { // Before the save operation
  if (this.isModified('password')) { // If the password was modified
    this.password = await bcrypt.hash(this.password, 12); // Hash it
  }

  if (this.isModified('password') && !this.isNew) { // If the password was modified and it was updated not created
    this.passwordChangedAt = Date.now() - 1000; // Store the time for passwordChanged
  }

  next(); // Proceed with saving the document
});

// Instance method for password comparison
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword); // Returns true or false
};

// Instance method to check if the password was changed after issuing a JWT
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance methods for two-factor authentication
userSchema.methods.enableTwoFactor = async function () {
  const secret = speakeasy.generateSecret();
  this.twoFactorSecret = secret.base32;
  this.twoFactorEnabled = true;
  await this.save();
  return secret.otpauth_url;
};

userSchema.methods.verifyTwoFactorCode = function (code) {
  return speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    token: code
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
