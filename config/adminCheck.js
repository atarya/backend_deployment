const User = require('../api/models/userModel');

async function adminCheck () {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;

    const adminExists = await User.findOne({ email: adminEmail, roles: 'admin' });

    if (adminExists) {
      console.log('ADMIN User was Initialised.'.bgGreen.red);
      return;
    }

    const adminUser = new User({
      username: process.env.ADMIN_USERNAME,
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD,
      roles: ['admin'],
      emailVerified: true
    });

    await adminUser.save();

    console.log('Default ADMIN Account Added'.bgWhite.red);
  } catch (error) {
    console.error('Error Creating Default User'.bgRed.white, error);
  }
}

adminCheck();

module.exports = adminCheck;
