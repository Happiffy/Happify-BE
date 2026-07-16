import profileRepository from '@/modules/profile/profile.repository.js';
import type { PsychologistApplicationDTO, UpdateProfileDTO } from '@/modules/profile/profile.validation.js';

class ProfileService {
  getProfile(userId: string) {
    return profileRepository.user.findUnique({
      where: { id: userId },
      include: { preference: true, psychologistApplication: true },
    });
  }

  updateProfile(userId: string, body: UpdateProfileDTO) {
    return profileRepository.user.update({
      where: { id: userId },
      data: {
        ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
      },
    });
  }

  applyPsychologist(body: PsychologistApplicationDTO) {
    const data = {
      userId: body.userId,
      fullName: body.fullName,
      licenseNumber: body.licenseNumber,
      certificateUrl: body.certificateUrl,
      institution: body.institution ?? null,
      reason: body.reason ?? null,
    };

    return profileRepository.psychologistApplication.upsert({
      where: { userId: body.userId },
      update: { ...data, status: 'PENDING', reviewedAt: null },
      create: data,
    });
  }

  listApplications() {
    return profileRepository.psychologistApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async reviewApplication(id: string, status: 'APPROVED' | 'REJECTED', reviewComment?: string) {
    const application = await profileRepository.psychologistApplication.update({
      where: { id },
      data: { status, reviewComment: reviewComment ?? null, reviewedAt: new Date() },
    });

    if (status === 'APPROVED') {
      await profileRepository.user.update({ where: { id: application.userId }, data: { role: 'PSYCHOLOGIST' } });
    }

    return application;
  }
}

export default new ProfileService();
