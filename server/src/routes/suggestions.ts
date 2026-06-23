import { Router, Request, Response } from 'express';
import { getDailySuggestion } from '../services/suggestionService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const apiKey = req.query.apiKey as string | undefined;
    const model = req.query.model as string | undefined;
    const prompt = req.query.prompt as string | undefined;
    if (apiKey && apiKey.length < 10) {
      res.status(400).json({ message: 'API Key 太短' });
      return;
    }
    const suggestion = await getDailySuggestion(apiKey, model, prompt);
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ message: '获取建议失败' });
  }
});

export default router;
