const validatePhoneNumber = (phoneNumber) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phoneNumber);
}

const generateOtp = () => {
  const otp = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return otp;
}

const sendOtp = async (phoneNumber, otp) => {
  //TODO: implement send SMS service and call it here
  console.log(`${phoneNumber}: ${otp} is your verification OTP.`.bgWhite.black)
}

const generateToken = async () => {
  //TODO: implement generate token
  return "TOKEN"
}

const sendVerificationEmail = async (email, token) => {
  //TODO: implement send email service and call it here
  console.log(`Send ${token}, to ${email}`)
}

module.exports = { validatePhoneNumber, generateOtp, sendOtp, generateToken, sendVerificationEmail }