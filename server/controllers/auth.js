const { connect } = require('getstream');
const bcrypt = require('bcrypt');
const { StreamChat } = require('stream-chat'); // ✅ make sure this import uses destructuring
const crypto = require('crypto');
require('dotenv').config();

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const app_id = process.env.STREAM_APP_ID;

const signup = async (req, res) => {
    try {
        const { fullName, username, password, phoneNumber, avatarURL } = req.body;
        const userId = crypto.randomBytes(16).toString('hex');

        const serverClient = connect(api_key, api_secret, app_id);
        const chatClient = StreamChat.getInstance(api_key, api_secret);

        const hashedPassword = await bcrypt.hash(password, 10);
        const token = serverClient.createUserToken(userId);

        // ✅ Upsert user to Stream Chat
        await chatClient.upsertUser({
            id: userId,
            name: username,
            fullName,
            image: avatarURL || `https://ui-avatars.com/api/?name=${username}`,
            hashedPassword,
            phoneNumber,
        });

        res.status(200).json({
            token,
            fullName,
            username,
            userId,
            hashedPassword,
            phoneNumber,
            avatarURL,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const serverClient = connect(api_key, api_secret, app_id);
        const client = StreamChat.getInstance(api_key, api_secret);

        const { users } = await client.queryUsers({ name: username });

        if (!users.length) return res.status(400).json({ message: 'User not found' });

        const user = users[0];
        const success = await bcrypt.compare(password, user.hashedPassword);
        const token = serverClient.createUserToken(user.id);

        if (success) {
            // ✅ Optionally update avatar or fullName on login
            await client.upsertUser({
                id: user.id,
                name: username,
                fullName: user.fullName,
                image: user.image,
                hashedPassword: user.hashedPassword,
                phoneNumber: user.phoneNumber,
            });

            res.status(200).json({
                token,
                fullName: user.fullName,
                username,
                userId: user.id,
                hashedPassword: user.hashedPassword,
                phoneNumber: user.phoneNumber,
                avatarURL: user.image,
            });
        } else {
            res.status(401).json({ message: 'Incorrect password' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { signup, login };
