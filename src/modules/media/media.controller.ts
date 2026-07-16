import type { Request, Response } from 'express';
import mediaService from '@/modules/media/media.service.js';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import { uploadImageSchema } from '@/modules/media/media.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';

class MediaController {
  async uploadImage(request: Request, response: Response) {
    try {
      const body = uploadImageSchema.parse(request.body);
      const image = await mediaService.uploadImage(getAuthUser(response).id, body);
      return response.status(201).json({ status: 'success', data: { image } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async getImage(request: Request, response: Response) {
    try {
      const key = decodeURIComponent(String(request.params.key ?? ''));
      if (!key.startsWith(`happify/${getAuthUser(response).id}/`)) return response.status(403).json({ status: 'error', message: 'FORBIDDEN' });
      const image = await mediaService.getImage(key);
      response.setHeader('Content-Type', image.contentType);
      response.setHeader('Cache-Control', 'private, max-age=3600');
      return response.send(image.buffer);
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new MediaController();
