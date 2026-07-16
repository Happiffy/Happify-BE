import type { Request, Response } from 'express';
import { idParamSchema } from '@/modules/shared.validation.js';
import { getErrorMessage, getStatusCode } from '@/utils/request.util.js';
import profileService from '@/modules/profile/profile.service.js';
import { profileQuerySchema, psychologistApplicationSchema, reviewPsychologistApplicationSchema, updateProfileSchema } from '@/modules/profile/profile.validation.js';

class ProfileController {
  async getProfile(request: Request, response: Response) {
    try {
      const query = profileQuerySchema.parse(request.query);
      const profile = await profileService.getProfile(query.userId);
      return response.json({ status: 'success', data: { profile } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async updateProfile(request: Request, response: Response) {
    try {
      const query = profileQuerySchema.parse(request.query);
      const body = updateProfileSchema.parse(request.body);
      const profile = await profileService.updateProfile(query.userId, body);
      return response.json({ status: 'success', data: { profile } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async applyPsychologist(request: Request, response: Response) {
    try {
      const body = psychologistApplicationSchema.parse(request.body);
      const application = await profileService.applyPsychologist(body);
      return response.status(201).json({ status: 'success', data: { application } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async listApplications(_request: Request, response: Response) {
    try {
      const applications = await profileService.listApplications();
      return response.json({ status: 'success', data: { applications } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }

  async reviewApplication(request: Request, response: Response) {
    try {
      const params = idParamSchema.parse(request.params);
      const body = reviewPsychologistApplicationSchema.parse(request.body);
      const application = await profileService.reviewApplication(params.id, body.status, body.reviewComment);
      return response.json({ status: 'success', data: { application } });
    } catch (error) {
      return response.status(getStatusCode(error)).json({ status: 'error', message: getErrorMessage(error) });
    }
  }
}

export default new ProfileController();
