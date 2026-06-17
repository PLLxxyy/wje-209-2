import { Router, Response } from 'express';
import db from './database';
import { authMiddleware, AuthRequest } from './middleware';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const notifications = db.prepare(`
    SELECT n.*, u.nickname as actor_name, u.avatar as actor_avatar
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(req.userId!);
  res.json({ notifications });
});

router.get('/unread-count', authMiddleware, (req: AuthRequest, res: Response) => {
  const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.userId!) as any;
  res.json({ count: row.count });
});

router.post('/:id/read', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.userId!);
  res.json({ message: '已标记为已读' });
});

router.post('/read-all', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.userId!);
  res.json({ message: '已全部标记为已读' });
});

export default router;
