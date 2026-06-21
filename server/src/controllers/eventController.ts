import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../db';

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, date, time, type, description } = req.body;
    if (!title || !date || !type) {
      res.status(400).json({ message: '标题、日期和类型不能为空' });
      return;
    }

    const event = await prisma.event.create({
      data: {
        userId: req.userId!,
        title,
        date: new Date(date),
        time,
        type,
        description
      }
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: '创建事件失败' });
  }
};

export const getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start, end, type } = req.query;
    const where: any = { userId: req.userId };

    if (start && end) {
      where.date = {
        gte: new Date(start as string),
        lte: new Date(end as string)
      };
    }
    if (type) {
      where.type = type;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: '获取事件失败' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!event) {
      res.status(404).json({ message: '事件不存在' });
      return;
    }

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: '更新事件失败' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!event) {
      res.status(404).json({ message: '事件不存在' });
      return;
    }
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: '事件已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除事件失败' });
  }
};
