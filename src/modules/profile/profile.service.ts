import profileRepository from '@/modules/profile/profile.repository.js';
import type { PsychologistApplicationDTO, UpdateProfileDTO } from '@/modules/profile/profile.validation.js';

class ProfileService {
  getProfile(userId: string) {
    return profileRepository.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        preference: true,
        psychologistApplication: true,
      },
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
      select: { id: true, email: true, displayName: true, role: true, avatarUrl: true, bio: true, updatedAt: true },
    });
  }

  applyPsychologist(userId: string, body: PsychologistApplicationDTO) {
    const data = {
      userId,
      fullName: body.fullName,
      licenseNumber: body.licenseNumber,
      certificateUrl: body.certificateUrl,
      institution: body.institution ?? null,
      reason: body.reason ?? null,
    };
    return profileRepository.psychologistApplication.upsert({
      where: { userId },
      update: { ...data, status: 'PENDING', reviewComment: null, reviewedById: null, reviewedAt: null },
      create: data,
    });
  }

  listApplications() {
    return profileRepository.psychologistApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, displayName: true, avatarUrl: true, role: true } } },
    });
  }

  async reviewApplication(id: string, reviewerId: string, status: 'APPROVED' | 'REJECTED', reviewComment: string) {
    return profileRepository.transaction(async (transaction) => {
      if (reviewerId === undefined) throw new Error('FORBIDDEN');
      const application = await transaction.psychologistApplication.findUnique({ where: { id }, select: { id: true, userId: true, status: true } });
      if (!application) throw new Error('NOT_FOUND');
      if (application.userId === reviewerId) throw new Error('FORBIDDEN');
      if (application.status !== 'PENDING') throw new Error('APPLICATION_ALREADY_REVIEWED');
      const reviewed = await transaction.psychologistApplication.update({
        where: { id },
        data: { status, reviewComment, reviewedById: reviewerId, reviewedAt: new Date() },
      });
      await transaction.user.update({ where: { id: application.userId }, data: { role: status === 'APPROVED' ? 'PSYCHOLOGIST' : 'USER' } });
      return reviewed;
    });
  }
}

export default new ProfileService();
