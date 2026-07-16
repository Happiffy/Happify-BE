import type { Request, Response } from 'express';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import { listByUserSchema } from '@/modules/shared.validation.js';
import journalService from '@/modules/journal/journal.service.js';
import { createJournalSchema } from '@/modules/journal/journal.validation.js';

class JournalController {
  async list(request: Request, response: Response) {
    try {
      const query = listByUserSchema.parse(request.query);
      const items = await journalService.list(query.userId, query.limit, query.page);
      return response.json({ status: 'success', data: { items, hasMore: items.length === query.limit } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async create(request: Request, response: Response) {
    try {
      const body = createJournalSchema.parse(request.body);
      const journal = await journalService.create(body);
      return response.status(201).json({ status: 'success', data: { journal } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new JournalController();
