import type { Request, Response } from 'express';
import { getAuthUser } from '@/modules/auth/auth.middleware.js';
import { idParamSchema } from '@/modules/shared.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import profileService from '@/modules/profile/profile.service.js';
import { psychologistApplicationSchema, reviewPsychologistApplicationSchema, updateProfileSchema } from '@/modules/profile/profile.validation.js';

class ProfileController {
  async getProfile(_request: Request, response: Response) {
    try {
      const profile = await profileService.getProfile(getAuthUser(response).id);
      return response.json({ status: 'success', data: { profile } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async updateProfile(request: Request, response: Response) {
    try {
      const profile = await profileService.updateProfile(getAuthUser(response).id, updateProfileSchema.parse(request.body));
      return response.json({ status: 'success', data: { profile } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async applyPsychologist(request: Request, response: Response) {
    try {
      const application = await profileService.applyPsychologist(getAuthUser(response).id, psychologistApplicationSchema.parse(request.body));
      return response.status(201).json({ status: 'success', data: { application } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async listApplications(_request: Request, response: Response) {
    try {
      return response.json({ status: 'success', data: { applications: await profileService.listApplications() } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async reviewApplication(request: Request, response: Response) {
    try {
      const params = idParamSchema.parse(request.params);
      const body = reviewPsychologistApplicationSchema.parse(request.body);
      const application = await profileService.reviewApplication(params.id, getAuthUser(response).id, body.status, body.reviewComment);
      return response.json({ status: 'success', data: { application } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new ProfileController();
