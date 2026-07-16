import type { Request, Response } from 'express';
import { idParamSchema } from '@/modules/shared.validation.js';
import providerService from '@/modules/provider/provider.service.js';
import { providerQuerySchema, providerSchema, updateProviderSchema } from '@/modules/provider/provider.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
class ProviderController {
  async list(request: Request, response: Response) { try { return response.json({ status: 'success', data: { items: await providerService.list(providerQuerySchema.parse(request.query)) } }); } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); } }
  async create(request: Request, response: Response) { try { const provider = await providerService.create(providerSchema.parse(request.body)); return response.status(201).json({ status: 'success', data: { provider } }); } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); } }
  async update(request: Request, response: Response) { try { const { id } = idParamSchema.parse(request.params); const provider = await providerService.update(id, updateProviderSchema.parse(request.body)); return response.json({ status: 'success', data: { provider } }); } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); } }
}
export default new ProviderController();
