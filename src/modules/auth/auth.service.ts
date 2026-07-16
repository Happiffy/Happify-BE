import { firebaseAuth } from '@/config/firebase.js';
import authRepository from '@/modules/auth/auth.repository.js';
import type { AuthVerifyDTO } from '@/modules/auth/auth.validation.js';

class AuthService {
  async verify(body: AuthVerifyDTO) {
    const decodedToken = await firebaseAuth.verifyIdToken(body.idToken);

    const data = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email ?? null,
      displayName: body.displayName ?? decodedToken.name ?? null,
      avatarUrl: decodedToken.picture ?? null,
    };

    const existingUser = await authRepository.user.findUnique({ where: { firebaseUid: decodedToken.uid } });
    if (!existingUser && body.mode === 'login') throw new Error('ACCOUNT_NOT_REGISTERED');

    return authRepository.transaction(async (transaction) => {
      await transaction.msRole.upsert({ where: { code: 'USER' }, update: {}, create: { code: 'USER' } });
      return transaction.msUser.upsert({
        where: { firebaseUid: decodedToken.uid },
        update: { email: data.email, displayName: data.displayName, avatarUrl: data.avatarUrl },
        create: data,
      });
    });
  }
}

export default new AuthService();
