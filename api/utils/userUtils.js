const User = require('../models/userModel');

const checkUserExistence = async (username, email) => {
    let query = {};
    let field = '';

    if (username) {
        query.username = username;
        field = 'username';
    } else if (email) {
        query.email = email;
        field = 'email';
    }

    const userExists = await User.findOne(query);
    return { exists: !!userExists, field };
};

module.exports = { checkUserExistence };
