const User = require('../models/userModel');
const { redis } = require('../../config/redis').client;
const { validatePhoneNumber, generateOtp, sendOtp, generateToken, sendVerificationEmail } = require('../utils/authUtils');
const { generatePresignedUrl } = require('../../config/aws');
const { checkUserExistence } = require('../utils/userUtils');
const { encrypt, decrypt } = require('../shared/crypt')
const { v4: uuidv4 } = require('uuid');

const addPhoneNumber = async (req, res) => {

  const { phoneNumber, userType, tncAccepted } = req.body;

  if (!tncAccepted) {
    return res.status(400).json({ message: 'Terms and Conditions must be accepted.' });
  }
 
  if (!['professional', 'partner'].includes(userType)) {
    return res.status(400).json({ message: 'Invalid user type.' });
  }

  if (!validatePhoneNumber(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number format.' });
  }

  const attemptsKey = `signup_attempts:${phoneNumber}`;
  try {
    const attempts = parseInt(await redis.get(attemptsKey)) || 0;
    if (attempts >= 5) {
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }

    await redis.multi().incr(attemptsKey).expire(attemptsKey, 10800).exec();

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      if (existingUser.userType !== userType) {
        return res.status(400).json({ message: `A ${existingUser.userType} account already exists with this phone number.` });
      } else if (existingUser.profileCreated) {
        return res.status(400).json({ message: 'Profile already exists.' });
      }
    }

    let otp = generateOtp()
    await sendOtp(phoneNumber, otp);

    otp = JSON.stringify(encrypt(otp))
    
    const otpKey = `otp:${phoneNumber}`;
    const userData = `signup_details:${phoneNumber}`;
    const userDetails = { userType, tncAccepted};
    await redis.multi()
      .set(otpKey, otp, { EX: 600 })
      .set(userData, JSON.stringify(userDetails), { EX: 10800 })
      .exec();
    
    res.json({ message: `OTP sent. Please verify.`, data:{ phoneNumber } });
  } catch (error) {
    console.error('Error in addPhoneNumber:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  const otpKey = `otp:${phoneNumber}`;
  try {
    let userDetails
    const otpValue = await redis.get(otpKey)
    const correctOtp = otpValue !== null ? decrypt(JSON.parse(otpValue)) : null

    if (!correctOtp) {
        return res.status(404).json({ message: 'OTP expired or not found.' });
    }

    if (correctOtp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP.' });
    }

    const userDataKey = `signup_details:${phoneNumber}`;
    const userDetailsString = await redis.get(userDataKey);
    await redis.del(userDataKey)

    if (userDetailsString) {
      userDetails = JSON.parse(userDetailsString)
    }

    userDetails.phoneNumber = phoneNumber
    userDetails.otpVerified = correctOtp === otp

    const url = await generatePresignedUrl('profile_image', phoneNumber);

    const reference = `signup:${uuidv4()}`
    await redis.set(reference, JSON.stringify(userDetails), {EX: 10800})

    res.json({
        message: 'OTP verified successfully.',
        data: {
          presignedUrl: url,
          reference
        }
    });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const checkExistingUser = async (req, res) => {
  const { username, email } = req.query;

  if (!username && !email) {
      return res.status(400).json({ message: 'Please provide a username or email to check.' });
  }

  try {
      const { exists, field } = await checkUserExistence(username, email);

      if (exists) {
          return res.status(409).json({ message: `A user with the given ${field} already exists.` });
      } else {
          return res.status(200).json({ message: 'No existing user found with the given username or email.' });
      }
  } catch (error) {
      console.error('Error checking existing user:', error);
      return res.status(500).json({ message: 'Server error while checking for existing user.' });
  }
};

const register = async (req, res) => {
  const { fullName, username, email, password, gender, imageUrl, birthdate, reference } = req.body;

  //TODO: dd more validations here or use a library like express-validator & as deifined in the schema

  try {
    const { exists } = await checkUserExistence(username, email);
    if (exists) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    //TODO: move user creation to userUtils/userController

    const userDetails = JSON.parse(await redis.get(reference))

    const newUser = new User({
      fullName,
      username,
      email,
      password,
      gender,
      imageUrl,
      birthdate,
      emailVerificationToken: await generateToken(),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      accountStatus: 'active',
      roles: ['user'],
      profileCompletion: true,
      phoneNumber : userDetails.phoneNumber,
      userType : userDetails.userType,
      tncAccepted : userDetails.tncAccepted,
      otpVerified : userDetails.otpVerified
    });

    const user = await newUser.save();

    await sendVerificationEmail(email, user.emailVerificationToken); //TODO:Send encrypted

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const login = async (req, res) => {
  const {userId, password} = req.body

  try {
    const user = await User.find({
      $or: [
        {email: userId}
      ]
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials', code: "INVALID" });
    }
    if (!user.emailVerified){
      return res.status(400).json({ message: 'User needs to verify email address', code: "EMAILVALIDATION" });
    }
    if (user.accountLockedUntil < new Date.now()) {
      return res.status(400).json({ message: 'User account is locked', code: "LOCKED" });
    }
    if (user.accountStatus !== 'active') {
      return res.status(400).json({ message: 'User account is deactivated', code: "DEACTIVATED" });
    }
    
    const loginSuccess = await User.correctPassword()

    if (!loginSuccess) {
      return res.status(400).json({ message: 'Invalid Credentials', code: "INVALID" });
    }

  } catch {

  }
}


module.exports = { addPhoneNumber, verifyOTP, checkExistingUser, register, login };
