const express = require('express');
const convertRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateUser } = require("../auth/middleware");

convertRouter.post('/', authenticateUser, async (req, res, next) => {
    const { playlistUrl } = req.body;

    if (playlistUrl.includes('youtube.com') || playlistUrl.includes('youtu.be')) {
        // Logic to fetch YouTube playlist data and generate embed code
        // Example:
        // const embedCode = generateYouTubeEmbedCode(playlistUrl);
        // res.json({ embedCode });
        const embedCode = `<iframe width="560" height="315" src="${playlistUrl}" frameborder="0" allowfullscreen></iframe>`;
        return res.json({ embedCode });
    }

    // Check if the URL is from Apple Music
    if (playlistUrl.includes('music.apple.com')) {
        // Logic to fetch Apple Music playlist data and generate embed code
        // Example:
        // const embedCode = generateAppleMusicEmbedCode(playlistUrl);
        // res.json({ embedCode });
        const embedCode = `<iframe src="${playlistUrl}" width="100%" height="450" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
        return res.json({ embedCode });
    }

    // Check if the URL is from Spotify
    if (playlistUrl.includes('open.spotify.com/playlist')) {
        // Logic to fetch Spotify playlist data and generate embed code
        // Example:
        // const embedCode = generateSpotifyEmbedCode(playlistUrl);
        // res.json({ embedCode });
        const embedCode = `<iframe src="https://open.spotify.com/embed/playlist/${getPlaylistIdFromUrl(playlistUrl)}" width="300" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
        return res.json({ embedCode });
    }

    // If the URL is not recognized
    res.status(400).json({ error: 'Unsupported playlist URL' });
});

function getPlaylistIdFromUrl(url) {
    // Extract the playlist ID from the Spotify playlist URL
    const parts = url.split('/');
    return parts[parts.length - 1];
}

module.exports = convertRouter;
