import type { Request, Response } from 'express';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import journalService from '@/modules/journal/journal.service.js';
import { createJournalSchema, journalListQuerySchema } from '@/modules/journal/journal.validation.js';

class JournalController {
  async list(request: Request, response: Response) {
    try {
      const query = journalListQuerySchema.parse(request.query);
      const items = await journalService.list(getAuthUser(response).id, query);
      return response.json({ status: 'success', data: { items, hasMore: items.length === query.limit } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async create(request: Request, response: Response) {
    try {
      const body = createJournalSchema.parse(request.body);
      const journal = await journalService.create(getAuthUser(response).id, body);
      return response.status(201).json({ status: 'success', data: { journal } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new JournalController();
