const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// Import your existing middlewares
const authMiddleware = require('../middleware/authMiddleware'); // Update path accordingly
const roleMiddleware = require('../middleware/roleMiddleware'); // Update path accordingly

router.get('/', async (req, res) => {
    const { category, search } = req.query;

    try {
        const resources = await prisma.resource.findMany({
            where: {
                AND: [
                    // Filter by category if frontend sent a pill selection
                    category ? { category: category } : {},
                    // Filter by search keyword if text is typed in search bar
                    search ? {
                        OR: [
                            { title: { contains: search, mode: 'insensitive' } },
                            { description: { contains: search, mode: 'insensitive' } }
                        ]
                    } : {}
                ]
            },
            orderBy: [
                { is_pinned: 'desc' }, // Pinned crisis contacts float to the top
                { created_at: 'desc' }  // Newest items second
            ]
        });

        return res.json(resources);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to retrieve resources." });
    }
});

router.post('/', authMiddleware, roleMiddleware(['coach', 'admin']), async (req, res) => {
    const { title, description, type, url, content, category, is_pinned } = req.body;
    
    // Grabbing the ID from your decoded token payload (req.userData)
    const creatorId = req.userData.id; 

    // Basic Validation
    if (!title || !type || !category) {
        return res.status(400).json({ error: "Title, type, and category are required fields." });
    }

    try {
        const newResource = await prisma.resource.create({
            data: {
                title,
                description,
                type,
                url,
                content,
                category,
                is_pinned: is_pinned || false,
                creator_id: creatorId
            }
        });

        return res.status(201).json({ message: "Resource uploaded successfully!", resource: newResource });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to upload resource." });
    }
});

module.exports = router;