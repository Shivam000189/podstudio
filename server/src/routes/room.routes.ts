import { Router } from "express";
import { customAlphabet } from 'nanoid';
import { create } from "node:domain";

const router = Router();

const generateId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

const temporaryRooms = new Map(); 

router.post('/rooms/create', (req, res) => {  
    const { createId } = req.body;            
    const roomId = generateId();
    
    const room = {
        roomId,
        createId,
        createdAt: new Date().toISOString(),
        participants: []
    };

    temporaryRooms.set(roomId, room);  // ✅ fixed

    res.status(201).json({
        GenerateID: roomId
    });
});


router.get('/rooms/:id', (req, res) => {
    const { id } = req.params;
    const room = temporaryRooms.get(id);

    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Add this user to participants (you'd send userId from frontend)
    const userId = req.headers['x-user-id'] || 'guest_' + Math.random().toString(36).slice(2, 7);
    
    if (!room.participants.includes(userId)) {
        room.participants.push(userId);
    }

    res.json({
        roomId: room.roomId,
        participants: room.participants,
        participantCount: room.participants.length
    });
});

export default router;