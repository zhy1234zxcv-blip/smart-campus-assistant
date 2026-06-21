import { Response, NextFunction } from 'express';
import prisma from '../db';

// 自动附加默认用户，跳过认证
export const attachUser = async (req: any, _res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findFirst();
    if (user) {
      req.userId = user.id;
    }
    next();
  } catch (e) {
    next();
  }
};
