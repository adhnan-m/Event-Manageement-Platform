const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'ad@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User found:');
            console.log(`Name: ${user.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`Password Hash: ${user.password.substring(0, 10)}...`);

            // Check password manually
            const isMatch = await user.matchPassword('123456');
            console.log(`Password '123456' match: ${isMatch}`);
        } else {
            console.log(`User with email ${email} not found.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
