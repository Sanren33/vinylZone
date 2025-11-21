import express from 'express'
const router = express.Router()

const model = 'vinyl'

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Get all vinyls
router.get('/vinyls', async (req, res) => {
    try {
        const { genre, search, sortBy = 'createdAt', order = 'desc' } = req.query

        const where = {}

        if (genre) where.genre = genre
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { artist: { contains: search, mode: 'insensitive' } }
            ]
        }

        const result = await prisma[model].findMany({
            where,
            include: {
                tracks: { orderBy: { side: 'asc' } }
            },
            orderBy: { [sortBy]: order }
        })

        res.send(result)
    } catch (err) {
        console.error('GET /vinyls error:', err)
        res.status(500).send({ error: 'Failed to fetch vinyls', details: err.message || err })
    }
})

// Get single vinyl by ID
router.get('/vinyls/:id', async (req, res) => {
    try {
        const result = await prisma[model].findUnique({
            where: { id: req.params.id },
            include: { tracks: { orderBy: { side: 'asc' } } }
        })

        if (!result) return res.status(404).send({ error: 'Vinyl not found' })

        res.send(result)
    } catch (err) {
        console.error('GET /vinyls/:id error:', err)
        res.status(500).send({ error: 'Failed to fetch vinyl', details: err.message || err })
    }
})

// Create new vinyl 
router.post('/vinyls', async (req, res) => {
    try {
        const created = await prisma[model].create({
            data: {
                ...req.body,
                tracks: req.body.tracks
                    ? { create: req.body.tracks }
                    : undefined
            }
        })
        res.status(201).send(created)
    } catch (err) {
        console.error('POST /vinyls error:', err)
        res.status(500).send({ error: 'Failed to create vinyl', details: err.message || err })
    }
})

// Update vinyl
router.put('/vinyls/:id', async (req, res) => {
    try {
        // Ensure vinyl exists
        const old = await prisma[model].findUnique({
            where: { id: req.params.id }
        })
        if (!old) return res.status(404).send({ error: 'Vinyl not found' })

        const { tracks, ...vinylData } = req.body

        if (tracks) {
            await prisma.track.deleteMany({
                where: { vinylId: req.params.id }
            })
        }

        const updated = await prisma[model].update({
            where: { id: req.params.id },
            data: {
                ...vinylData,
                tracks: tracks ? { create: tracks } : undefined
            },
            include: { tracks: { orderBy: { side: 'asc' } } }
        })

        res.send(updated)
    } catch (err) {
        console.error('PUT /vinyls/:id error:', err)
        res.status(500).send({ error: 'Failed to update vinyl', details: err.message || err })
    }
})

// Delete vinyl
router.delete('/vinyls/:id', async (req, res) => {
    try {
        // Ensure vinyl exists
        const exists = await prisma[model].findUnique({
            where: { id: req.params.id }
        })
        if (!exists) return res.status(404).send({ error: 'Vinyl not found' })

        await prisma[model].delete({
            where: { id: req.params.id }
        })

        res.send({ message: 'Vinyl deleted successfully' })
    } catch (err) {
        console.error('DELETE /vinyls/:id error:', err)
        res.status(500).send({ error: 'Failed to delete vinyl', details: err.message || err })
    }
})

// Add track to vinyl
router.post('/vinyls/:id/tracks', async (req, res) => {
    try {
        const exists = await prisma[model].findUnique({
            where: { id: req.params.id }
        })
        if (!exists) return res.status(404).send({ error: 'Vinyl not found' })

        const track = await prisma.track.create({
            data: {
                ...req.body,
                vinylId: req.params.id
            }
        })

        res.status(201).send(track)
    } catch (err) {
        console.error('POST /vinyls/:id/tracks error:', err)
        res.status(500).send({ error: 'Failed to add track', details: err.message || err })
    }
})

// Statistics
router.get('/statistics', async (req, res) => {
    try {
        const totalVinyls = await prisma[model].count()

        const byGenre = await prisma[model].groupBy({
            by: ['genre'],
            _count: { genre: true }
        })

        const byYear = await prisma[model].groupBy({
            by: ['year'],
            _count: { year: true },
            orderBy: { year: 'desc' }
        })

        res.send({
            totalVinyls,
            vinylsByGenre: byGenre.map(v => ({
                genre: v.genre || 'Unknown',
                count: v._count.genre
            })),
            vinylsByYear: byYear.map(v => ({
                year: v.year || 'Unknown',
                count: v._count.year
            }))
        })
    } catch (err) {
        console.error('GET /vinyls-statistics error:', err)
        res.status(500).send({ error: 'Failed to compute statistics', details: err.message || err })
    }
})

export default router;
