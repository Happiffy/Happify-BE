import type { Request, Response } from 'express';
import { z } from 'zod';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import { idParamSchema } from '@/modules/shared.validation.js';
import communityService from '@/modules/community/community.service.js';
import { createCommunityPostSchema } from '@/modules/community/community.validation.js';

const communityListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(30).default(10),
  userId: z.string().min(1).optional(),
});

class CommunityController {
  async list(request: Request, response: Response) {
    try {
      const query = communityListQuerySchema.parse(request.query);
      const items = await communityService.list(query.cursor, query.limit, query.userId);
      const nextCursor = items.length === query.limit ? items[items.length - 1]?.id : null;
      return response.json({ status: 'success', data: { items, nextCursor } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async create(request: Request, response: Response) {
    try {
      const body = createCommunityPostSchema.parse(request.body);
      const post = await communityService.create(body);
      return response.status(201).json({ status: 'success', data: { post } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async comment(request: Request, response: Response) {
    try {
      const params = idParamSchema.parse(request.params);
      const body = z.object({ userId: z.string().optional(), content: z.string().max(400).default(''), imageUrl: z.string().max(700000).regex(/^(https?:\/\/|data:image\/)/).optional() }).refine((value) => value.content.trim() || value.imageUrl, { message: 'Reply text or image is required' }).parse(request.body);
      const comment = await communityService.comment(params.id, body);
      return response.status(201).json({ status: 'success', data: { comment } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async support(request: Request, response: Response) {
    try {
      const params = idParamSchema.parse(request.params);
      const body = z.object({ userId: z.string().min(1) }).parse(request.body);
      const post = await communityService.support(params.id, body.userId);
      return response.json({ status: 'success', data: { post } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new CommunityController();
