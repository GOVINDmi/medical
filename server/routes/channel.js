const express = require('express');
const { StreamChat } = require('stream-chat');
const { connect } = require('getstream');
const router = express.Router();
const redis = require('../redisClient');


const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const CHAT_REQUEST_TTL = 3600;

const serverClient = connect(api_key, api_secret);
const chatClient = StreamChat.getInstance(api_key, api_secret);

// POST /api/add-member
router.post('/add-member', async (req, res) => {
    console.log(1);
  const { channelId, userId } = req.body;
  console.log(channelId,userId);

  if (!channelId || !userId) {
    return res.status(400).json({ message: 'channelId and userId are required' });
  }

  try {
    const channel = chatClient.channel('team', channelId);
    await channel.addMembers(userId);

    return res.status(200).json({ message: `User ${userId} added to channel ${channelId}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to add member', error: error.message });
  }
});


router.post('/remove-member', async (req, res) => {
    const { channelId, userId } = req.body;
  
    if (!channelId || !userId) {
      return res.status(400).json({ message: 'channelId and userId are required' });
    }
  
    try {
      const channel = chatClient.channel('team', channelId);
      await channel.watch(); // optional
      await channel.removeMembers([userId]);
  
      return res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing member:', error);
      return res.status(500).json({
        message: error?.response?.data?.message || error?.message || 'Unknown error'
      });
    }
  });




module.exports = router;
