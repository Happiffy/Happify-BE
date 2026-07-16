import type { Request, Response } from 'express';
import { z } from 'zod';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import referralService from '@/modules/referral/referral.service.js';
import { createCareChatMessageSchema, createReferralSchema, reviewReferralSchema } from '@/modules/referral/referral.validation.js';

const paginationSchema = { page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(5) };
const listReferralQuerySchema = z.object({ userId: z.string().min(1).optional(), ...paginationSchema });
const listChatQuerySchema = z.object({ userId: z.string().min(1), ...paginationSchema });

class ReferralController {
  async list(request: Request, response: Response) {
    try {
      const query = listReferralQuerySchema.parse(request.query);
      const items = await referralService.list(query.userId, query.page, query.limit);
      return response.json({ status: 'success', data: { items, hasMore: items.length === query.limit } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async review(request: Request, response: Response) {
    try {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const body = reviewReferralSchema.parse(request.body);
      const referral = await referralService.review(params.id, body);
      return response.json({ status: 'success', data: { referral } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async create(request: Request, response: Response) {
    try {
      const body = createReferralSchema.parse(request.body);
      const referral = await referralService.create(body);
      return response.status(201).json({ status: 'success', data: { referral } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async listChats(request: Request, response: Response) {
    try {
      const query = listChatQuerySchema.parse(request.query);
      const items = await referralService.listChatSessions(query.userId, query.page, query.limit);
      return response.json({ status: 'success', data: { items, hasMore: items.length === query.limit } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async getChat(request: Request, response: Response) {
    try {
      const params = z.object({ sessionId: z.string().min(1) }).parse(request.params);
      const session = await referralService.getChatSession(params.sessionId);
      return response.json({ status: 'success', data: { session } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async updateChatStatus(request: Request, response: Response) {
    try {
      const params = z.object({ sessionId: z.string().min(1) }).parse(request.params);
      const body = z.object({ status: z.enum(['OPEN', 'CLOSED']) }).parse(request.body);
      const session = await referralService.updateChatSessionStatus(params.sessionId, body.status);
      return response.json({ status: 'success', data: { session } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async createChatMessage(request: Request, response: Response) {
    try {
      const params = z.object({ sessionId: z.string().min(1) }).parse(request.params);
      const body = createCareChatMessageSchema.parse(request.body);
      const message = await referralService.createChatMessage(params.sessionId, body);
      return response.status(201).json({ status: 'success', data: { message } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new ReferralController();
