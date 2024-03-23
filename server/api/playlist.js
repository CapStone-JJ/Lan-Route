const express = require('express');
const playlistRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateUser } = require("../auth/middleware");

function getPlaylistIdFromUrl(url) {
    // Extract the playlist ID from the Spotify playlist URL
    const parts = url.split('/');
    return parts[parts.length - 1];
}

playlistRouter.post('/', authenticateUser, async (req, res, next) => {
    const { playlistUrl, title, description, userId } = req.body;
    let embedCode = '';

    // Generate embed code based on the playlist URL
    if (playlistUrl.includes('youtube.com') || playlistUrl.includes('youtu.be')) {
        // Logic for generating YouTube embed code
        embedCode = `<iframe width="560" height="315" src="${playlistUrl}" frameborder="0" allowfullscreen></iframe>`;
    } else if (playlistUrl.includes('music.apple.com')) {
        // Logic for generating Apple Music embed code
        embedCode = `<iframe src="${playlistUrl}" width="100%" height="450" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
    } else if (playlistUrl.includes('open.spotify.com/playlist')) {
        // Logic for generating Spotify embed code
        embedCode = `<iframe src="https://open.spotify.com/embed/playlist/${getPlaylistIdFromUrl(playlistUrl)}" width="300" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
    } else {
        return res.status(400).json({ error: 'Unsupported playlist URL' });
    }

    try {
        // Create a Playlist entity with the generated embedCode
        const playlist = await prisma.playlist.create({
            data: {
                url: playlistUrl,
                title: title || null,
                description: description || null,
                owner: { connect: { id: userId } },
                embedCode,
                // Add other properties as needed
            },
        });

        res.json({ playlist });
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

playlistRouter.get('/:id', authenticateUser, async (req, res, next) => {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'Invalid playlist ID' });
    }

    try {
        const playlist = await prisma.playlist.findUnique({
            where: { id: parseInt(id) },
            include: { owner: { select: { username: true } } }, // Include the owner's username
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        res.json({ playlist });
    } catch (error) {
        console.error('Error retrieving playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

playlistRouter.put('/:id', authenticateUser, async (req, res, next) => {
    const { id, title, description } = req.body.body;
    console.log(title)

    try {
        const updatedPlaylist = await prisma.playlist.update({
            where: { id: parseInt(id) },
            data: { title, description },
        });

        res.json({ playlist: updatedPlaylist });
    } catch (error) {
        console.error('Error updating playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

playlistRouter.delete('/:id', authenticateUser, async (req, res, next) => {
    const { id } = req.params;
    console.log(id)

    try {
        await prisma.playlist.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        console.error('Error deleting playlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



playlistRouter.get('/playlists/:category', async (req, res, next) => {
    const { category } = req.params;

    try {
        let playlists;

        // Fetch playlists based on category
        switch (category) {
            case 'new':
                playlists = await prisma.playlist.findMany({ take: 10, orderBy: { id: 'desc' }, include: { owner: { select:  { username: true} } }});
                break;
            case 'YouTube':
                playlists = await prisma.playlist.findMany({ where: { url: { contains: 'youtube.com' }, include: { select:  { owner: { username: true} } }}});
                break;
            case 'AppleMusic':
                playlists = await prisma.playlist.findMany({ where: { url: { contains: 'music.apple.com' }, include: { owner: { select: { username: true}} }}});
                break;
            case 'Spotify':
                playlists = await prisma.playlist.findMany({take: 10, orderBy: { id: 'desc'}, include: { owner: { select:  { username: true} }}});
                break;
            default:
                return res.status(400).json({ error: 'Invalid category' });
        }

        res.json({ playlists });
    } catch (error) {
        console.error('Error retrieving playlists:', error);
        res.status(500).json({ error: 'Internal server error' });
    };

    playlistRouter.get('/user/:userId', authenticateUser, async (req, res, next) => {
        const { userId } = req.params;
    
        try {
            // Parse the userId as an integer
            const parsedUserId = parseInt(userId);
    
            // Check if the parsedUserId is a valid number
            if (isNaN(parsedUserId)) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }
    
            // Find playlists associated with the specified user ID
            const playlists = await prisma.playlist.findMany({
                where: { owner: { id: parsedUserId } }, // Assuming ownerId is the foreign key referencing the user
            });
    
            res.json({ playlists });
        } catch (error) {
            console.error('Error retrieving user playlists:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    

    // Assuming you have a User model in your Prisma schema

playlistRouter.post('/add-to-profile/:playlistId', authenticateUser, async (req, res, next) => {
    const { playlistId } = req.params;
    const userId = req.user.id;

    try {
        // Check if the playlist exists
        const playlist = await prisma.playlist.findUnique({
            where: { id: parseInt(playlistId) },
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        // Check if the playlist is already added to the user's profile
        const existingPlaylist = await prisma.user.findUnique({
            where: { id: userId },
            select: { playlists: { where: { id: parseInt(playlistId) } } },
        });

        if (existingPlaylist) {
            return res.status(400).json({ error: 'Playlist already added to your profile' });
        }

        // Add the playlist to the user's profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                playlists: {
                    connect: { id: parseInt(playlistId) },
                },
            },
        });

        res.json({ message: 'Playlist added to your profile successfully', user: updatedUser });
    } catch (error) {
        console.error('Error adding playlist to profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

})

module.exports = playlistRouter;
