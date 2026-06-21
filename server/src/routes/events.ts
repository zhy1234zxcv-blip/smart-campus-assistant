import { Router } from 'express';
import { attachUser } from '../middleware/attachUser';
import { createEvent, getEvents, updateEvent, deleteEvent } from '../controllers/eventController';

const router = Router();

router.use(attachUser as any);
router.post('/', createEvent as any);
router.get('/', getEvents as any);
router.put('/:id', updateEvent as any);
router.delete('/:id', deleteEvent as any);

export default router;
