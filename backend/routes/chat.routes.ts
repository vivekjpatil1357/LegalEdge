import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

const router = express.Router();

// get all users
router.get('/', async (req: Request, res: Response) => {
    const uid = req.body.uid;
    console.log(uid);
    const user = await prisma.user.findUnique({ where: { firebaseId: uid } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    let chats = await prisma.chat.findMany({ where: { user_id: user.user_id } });
    console.log(chats);
    res.json(chats);
    return
});














export default router;
