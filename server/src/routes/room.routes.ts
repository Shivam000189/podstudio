import { Router } from "express";
import { customAlphabet } from 'nanoid';

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

export default router;