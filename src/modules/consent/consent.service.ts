import consentRepository from '@/modules/consent/consent.repository.js';
import type { UpdateConsentDTO } from '@/modules/consent/consent.validation.js';

class ConsentService {
  list(userId: string, scope?: UpdateConsentDTO['scope']) {
    return consentRepository.document.findMany({
      where: { isActive: true, effectiveAt: { lte: new Date() }, ...(scope ? { scope } : {}) },
      orderBy: [{ scope: 'asc' }, { version: 'desc' }],
      include: { consents: { where: { userId }, select: { status: true, acceptedAt: true, revokedAt: true, source: true } } },
    });
  }

  async update(userId: string, body: UpdateConsentDTO) {
    const document = await consentRepository.document.findUnique({ where: { scope_version: { scope: body.scope, version: body.version } } });
    if (!document || !document.isActive || document.effectiveAt > new Date()) throw new Error('CONSENT_DOCUMENT_NOT_FOUND');
    const now = new Date();
    return consentRepository.consent.upsert({
      where: { userId_documentId: { userId, documentId: document.id } },
      update: { status: body.accepted ? 'ACCEPTED' : 'REVOKED', acceptedAt: body.accepted ? now : null, revokedAt: body.accepted ? null : now, source: body.source },
      create: { userId, documentId: document.id, scope: document.scope, version: document.version, status: body.accepted ? 'ACCEPTED' : 'REVOKED', acceptedAt: body.accepted ? now : null, revokedAt: body.accepted ? null : now, source: body.source },
    });
  }
}
export default new ConsentService();
