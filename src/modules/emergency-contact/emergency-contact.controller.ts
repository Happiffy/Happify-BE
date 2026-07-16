import type { Request, Response } from 'express';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import { idParamSchema } from '@/modules/shared.validation.js';
import emergencyContactService from '@/modules/emergency-contact/emergency-contact.service.js';
import { emergencyContactSchema, updateEmergencyContactSchema } from '@/modules/emergency-contact/emergency-contact.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
class EmergencyContactController {
  async list(_request: Request, response: Response) { try { return response.json({ status: 'success', data: { items: await emergencyContactService.list(getAuthUser(response).id) } }); } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); } }
  async create(request: Request, response: Response) { try { const contact = await emergencyContactService.create(getAuthUser(response).id, emergencyContactSchema.parse(request.body)); return response.status(201).json({ status: 'success', data: { contact } }); } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); } }
  async update(request: Request, response: Response) { try { const { id } = idParamSchema.parse(request.params); const contact = await emergencyContactService.update(getAuthUser(response).id, id, updateEmergencyContactSchema.parse(request.body)); return response.json({ status: 'success', data: { contact } }); } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); } }
  async remove(request: Request, response: Response) { try { const { id } = idParamSchema.parse(request.params); await emergencyContactService.remove(getAuthUser(response).id, id); return response.status(204).send(); } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); } }
}
export default new EmergencyContactController();
