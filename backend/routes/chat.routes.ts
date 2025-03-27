import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

const router = express.Router();

// get all users
router.get('/:id', async (req: Request, res: Response) => {
    const id = req.params.id;
    console.log(id);
    const user = await prisma.user.findUnique({
        where: { user_id: parseInt(id) }});
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    let chats = await prisma.chat.findMany({ where: { user_id: user.user_id },include:{user:true} });

    console.log(chats);
    res.json(chats);
    return
});

router.post('/createChat', async (req: Request, res: Response) =>
{
    console.log('inside createchat');

    const { sender_id, receiver_id, message } = req.body;
    const chat = await prisma.chat.create({
        data: {
            user_id: sender_id,
            lawyer_id: receiver_id,
            status: 'PENDING',
        }

    });
    
    const chatMessage= await prisma.chatMessage.create({
        data: {
            chat_id: chat.chat_id,
            sender_id: sender_id,
            message_text: message
        }
    })
    res.json(chat);
})

router.get('/messages/:chatId', async (req: Request, res: Response) => {
    
})












export default router;
