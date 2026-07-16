import type { Request, Response } from 'express';
import mediaService from '@/modules/media/media.service.js';
import { uploadImageSchema } from '@/modules/media/media.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';

class MediaController {
  async uploadImage(request: Request, response: Response) {
    try {
      const body = uploadImageSchema.parse(request.body);
      const image = await mediaService.uploadImage(body);
      return response.status(201).json({ status: 'success', data: { image } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async getImage(request: Request, response: Response) {
    try {
      const key = decodeURIComponent(String(request.params.key ?? ''));
      if (!key.startsWith('happify/')) return response.status(400).json({ status: 'error', message: 'Invalid image key' });
      const image = await mediaService.getImage(key);
      response.setHeader('Content-Type', image.contentType);
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return response.send(image.buffer);
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new MediaController();
