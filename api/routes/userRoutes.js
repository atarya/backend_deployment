const Express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const router = Express.Router();

// TODO:app.post(/api/signup/addNumber) it is called with the field "professional / partner" which are the userTypesallowed, it comes only when the user accepts TnC on the App, userType, TnC Acceptedfield is also added to the request body, check redis to see if more than 5 attempts exist, ask to wait for some time (3 Hours), else if exists in redis && <= 5 attempts || not found in redis, Validate that its a phone number, check for existing records, if present and profile created already + userType is different send error "a userType account already exists", else if same userType account exists, show error "profile already exists" else if profile not created delete the record then proceed, Save Phone Number and userType. Issue, send, and save OTP, Valid for 10 minutes (use redis to store for 10 minutes), Then redis autodeletes phonenumber + otp, implement rate limiter with redis for signup attempts by using the same counter as resend otp`

router.post('/signup/add-number', authController.addPhoneNumber);

// TODO:app.post(/api/signup/verifyOTP) validate the OTP for the number from through redis, if invalid otp or expired otp or number not found return error. else generate, save, and send a presigned S3 URL to upload profile image then return the data; phoneNumber, userType as req.user with a success message

router.post('/signup/verify-otp', authController.verifyOTP);

// TODO:app.post(/api/signup/check-existing) check if username || email already exists return true/false

router.post('/signup/check-existing', authController.checkExistingUser);

// TODO:app.post(/api/signup/details)(this will call a method from the user controller to create the user after other steps are done here, also re check existing users) accept details for the user: fullName, username, email, password, userType, gender, uploaded image URL/id, & birthdate, run validations including the ones defined in the user schema, show errors if any, else generate an email confirmation token, send email with token, additional fields; emailVerificationToken = token, emailVerificationExpires = Now +1 Day, accountStatus = active, roles = user, profileCompletion = true, otpVerified = true, TnCAccepted = true, return success message and inform to verify email and then signIn

router.post('signup/details', authController.register);

// TODO:app.post(/api/signIn) verify email/username/phoneNumber + password if incorrect keep failed attempts count and update failedLoginAttempts if user exists, track and check in redis failed attempts, lock account for 24 hours if 5 failed attempts and send email update, check emailVerified field + emailVerificationExpires field, if email verified and emailVerificationExpires > Now, issue JWT tokens (TODO: add further security steps) and initialise session and add in sessions field, if not verified and emailVerificationExpires is > Now, inform user and ask to verify, if not and emailVerificationExpires is < Now, inform user that token expired and email verifiation pending, also if email verified but emailVerificationExpires < Now, generate a new token, resend email, update emailVerificationToken, & emailVerificationExpires for Now + 1 Day, and inform user to verify, also if TnC approved is false, show TnC and ask to accept. add checks in redis to 

router.post('login', authController.login)

// TODO:app.post(/api/signup/verifyEmail) find the emailVerificationToken, if exists mark emailVerified and emailVerificationExpires += 1 Year from Now, show success message and ask to login

// TODO:app.post(/api/account/retrieve) enter username/email/phoneNumber to see hints of the other details

// TODO:app.post(/api/account/forgotPassword)enter username/email/phoneNumber, find the User details, if account is locked, ask to try again later, else generate a passwordResetToken, save in Document passwordResetToken + passwordResetExpires = Now + 1 Day, send the email with encrypted token, notify the user to check email with hint of email +++ using phoneNumber find the account details, generate, and send the OTP use redis to store encrypted OTP and map it to the user only for 10 minutes +++ add resend email / OTP upto 3 times, keep a track in redis if more attempts lock account for 24 hours

// TODO:app.post(/api/account/resetPassword) the link with the token will open this a new page where the token and the new password will be sent, find the document with the passwordResetToken hash and update the password +++ takes the phone number, OTP, and password, finds the mapped account in redis and resets the password

// TODO:on the FE add upload image to S3, and I am not a robot captcha
// TODO:google signup, signin
// TODO: Update account details including password and other settings like 2FA etc check schema.

module.exports = router;
