import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthUser } from '@/modules/auth/auth.middleware.js';
import voiceService from '@/modules/voice/voice.service.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';

class VoiceController {
  async process(request: Request, response: Response) {
    try {
      const authUser = response.locals.authUser as AuthUser;
      const language = z.enum(['id', 'en']).catch('id').parse(request.headers['x-voice-language']);
      const contentType = request.headers['content-type']?.split(';', 1)[0] ?? '';
      const audio = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
      const turn = await voiceService.process(authUser.id, audio, contentType, language);
      return response.status(201).json({ status: 'success', data: { turn } });
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }

  async audio(request: Request, response: Response) {
    try {
      const { turnId } = z.object({ turnId: z.string().min(1) }).parse(request.params);
      const authUser = response.locals.authUser as AuthUser;
      const upstream = await voiceService.getAudio(turnId, authUser.id);
      response.status(upstream.status);
      response.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'audio/mpeg');
      response.setHeader('Cache-Control', 'private, no-store');
      return response.send(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }
}

export default new VoiceController();
