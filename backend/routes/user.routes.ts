import express, { Request, Response } from 'express';
import { prisma } from '../prisma';


const router = express.Router();

// get all users
router.get('/', async (req: Request, res: Response) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

// get user by id
router.get('/:id', async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({ where: { firebaseId: req.params.id } });
    res.json(user);
});
export default router;
