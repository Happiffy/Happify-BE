import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthUser } from '@/modules/auth/auth.middleware.js';
import deviceService from '@/modules/device/device.service.js';
import { startPairingSchema, updateDeviceSchema } from '@/modules/device/device.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';

class DeviceController {
  async list(_request: Request, response: Response) {
    try {
      const authUser = response.locals.authUser as AuthUser;
      return response.json({ status: 'success', data: { items: await deviceService.list(authUser.id) } });
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }

  async get(request: Request, response: Response) {
    try {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      const authUser = response.locals.authUser as AuthUser;
      return response.json({ status: 'success', data: { device: await deviceService.get(id, authUser.id) } });
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }

  async update(request: Request, response: Response) {
    try {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      const body = updateDeviceSchema.parse(request.body);
      const authUser = response.locals.authUser as AuthUser;
      return response.json({ status: 'success', data: { device: await deviceService.update(id, authUser.id, body.displayName) } });
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }

  async startPairing(request: Request, response: Response) {
    try {
      const body = startPairingSchema.parse(request.body);
      const authUser = response.locals.authUser as AuthUser;
      const session = await deviceService.startPairing(authUser.id, body.serialNumber, body.claimSecret);
      return response.status(201).json({ status: 'success', data: { session } });
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }

  async getPairing(request: Request, response: Response) {
    try {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      const authUser = response.locals.authUser as AuthUser;
      return response.json({ status: 'success', data: { session: await deviceService.getPairing(id, authUser.id) } });
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }

  async completePairing(request: Request, response: Response) {
    try {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      const authUser = response.locals.authUser as AuthUser;
      return response.json({ status: 'success', data: { device: await deviceService.completePairing(id, authUser.id) } });
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }

  async cancelPairing(request: Request, response: Response) {
    try {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      const authUser = response.locals.authUser as AuthUser;
      await deviceService.cancelPairing(id, authUser.id);
      return response.status(204).send();
    } catch (error) { return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) }); }
  }
}

export default new DeviceController();
