import type { Request, Response } from 'express';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import { idParamSchema, paginationSchema } from '@/modules/shared.validation.js';
import communityService from '@/modules/community/community.service.js';
import { communityListQuerySchema, communityReportSchema, createCommunityCommentSchema, createCommunityPostSchema, moderationSchema } from '@/modules/community/community.validation.js';

class CommunityController {
  async list(request: Request, response: Response) {
    try {
      const query = communityListQuerySchema.parse(request.query);
      const items = await communityService.list(query.cursor, query.limit, getAuthUser(response).id);
      const nextCursor = items.length === query.limit ? items[items.length - 1]?.id : null;
      return response.json({ status: 'success', data: { items, nextCursor } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async create(request: Request, response: Response) {
    try {
      const post = await communityService.create(getAuthUser(response).id, createCommunityPostSchema.parse(request.body));
      return response.status(201).json({ status: 'success', data: { post } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async comment(request: Request, response: Response) {
    try {
      const params = idParamSchema.parse(request.params);
      const comment = await communityService.comment(params.id, getAuthUser(response).id, createCommunityCommentSchema.parse(request.body));
      return response.status(201).json({ status: 'success', data: { comment } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async support(request: Request, response: Response) {
    try {
      const params = idParamSchema.parse(request.params);
      const post = await communityService.support(params.id, getAuthUser(response).id);
      return response.json({ status: 'success', data: { post } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async report(request: Request, response: Response) {
    try {
      const report = await communityService.report(getAuthUser(response).id, communityReportSchema.parse(request.body));
      return response.status(201).json({ status: 'success', data: { report } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async listReports(request: Request, response: Response) {
    try {
      const query = paginationSchema.parse(request.query);
      const reports = await communityService.listReports(query.page, query.limit);
      return response.json({ status: 'success', data: { reports, hasMore: reports.length === query.limit } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async moderate(request: Request, response: Response) {
    try {
      const audit = await communityService.moderate(getAuthUser(response).id, moderationSchema.parse(request.body));
      return response.json({ status: 'success', data: { audit } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new CommunityController();
