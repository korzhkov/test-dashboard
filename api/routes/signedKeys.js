const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const config = require('../config/default');

// GET /api/signed-keys/token
// Generates a signed token for video embedding
// Query params: videoId (required), expiryMinutes (optional, default: 2)
router.get('/token', (req, res) => {
    try {
        const { videoId, expiryMinutes = 2 } = req.query;
        const signingKey = config.signedKeys.signingKey;
        
        if (!signingKey) {
            return res.status(500).json({ error: 'Signing key not configured. Please set SIGNING_KEY in .env file' });
        }
        
        if (!videoId) {
            return res.status(400).json({ error: 'videoId parameter is required' });
        }
        
        // Calculate expiry time in UTC
        const now = new Date();
        const expiryTime = new Date(now.getTime() + parseInt(expiryMinutes) * 60 * 1000);
        
        // Format timestamp as YYYYMMDDHHMMSS in UTC
        const expiryTimestamp = expiryTime.toISOString()
            .replace(/[-:T]/g, '')
            .replace(/\.\d{3}Z$/, '');
        
        // Generate MD5 hash: <video_id>:<signing_key>:<expiry_timestamp>
        const hashString = `${videoId}:${signingKey}:${expiryTimestamp}`;
        const signature = crypto.createHash('md5').update(hashString).digest('hex');
        
        // Generate token with prefix "2." (video-specific token format)
        // Format: 2.<expiry_timestamp>.<signature>
        const token = `2.${expiryTimestamp}.${signature}`;
        
        res.json({ 
            token,
            expiryTimestamp,
            expiresAt: expiryTime.toISOString()
        });
    } catch (err) {
        console.error('Error generating signed token:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

