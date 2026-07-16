import communityRepository from '@/modules/community/community.repository.js';
import type { CommunityReportDTO, CreateCommunityPostDTO, ModerationDTO } from '@/modules/community/community.validation.js';
import { broadcast } from '@/modules/realtime/realtime.js';
import { richTextToPlainText, sanitizeRichText } from '@/utils/html.util.js';

function toPublicComment(comment: { id: string; alias: string; content: string; imageUrl: string | null; createdAt: Date }) {
  return { id: comment.id, alias: comment.alias, content: comment.content, imageUrl: comment.imageUrl, createdAt: comment.createdAt };
}

function toPublicPost(post: { id: string; alias: string; content: string; imageUrl: string | null; mood: string | null; supportCount: number; createdAt: Date; comments?: Array<{ id: string; alias: string; content: string; imageUrl: string | null; createdAt: Date }> }, likedByMe = false) {
  return { id: post.id, alias: post.alias, content: post.content, imageUrl: post.imageUrl, mood: post.mood, supportCount: post.supportCount, createdAt: post.createdAt, comments: (post.comments ?? []).map(toPublicComment), likedByMe };
}

class CommunityService {
  async list(cursor: string | undefined, limit: number, userId: string) {
    const posts = await communityRepository.communityPost.findMany({
      where: { isHidden: false },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        comments: { where: { isHidden: false }, orderBy: { createdAt: 'asc' }, take: 5 },
        supports: { where: { userId }, select: { id: true } },
      },
    });
    return posts.map((post) => toPublicPost(post, post.supports.length > 0));
  }

  async create(userId: string, body: CreateCommunityPostDTO) {
    const content = sanitizeRichText(body.content);
    if (!richTextToPlainText(content)) throw new Error('INVALID_CONTENT');
    const post = await communityRepository.communityPost.create({
      data: { userId, alias: body.alias, content, imageUrl: body.imageUrl ?? null, mood: body.mood ?? null },
    });
    const publicPost = toPublicPost(post);
    broadcast('community', { type: 'community:post', post: publicPost });
    return publicPost;
  }

  async comment(postId: string, userId: string, body: { content: string; imageUrl?: string | undefined }) {
    const post = await communityRepository.communityPost.findFirst({ where: { id: postId, isHidden: false }, select: { id: true } });
    if (!post) throw new Error('NOT_FOUND');
    const content = sanitizeRichText(body.content);
    if (!richTextToPlainText(content) && !body.imageUrl) throw new Error('INVALID_CONTENT');
    const comment = await communityRepository.communityComment.create({
      data: { postId, userId, alias: 'Anonymous', content, imageUrl: body.imageUrl ?? null },
    });
    const publicComment = toPublicComment(comment);
    broadcast('community', { type: 'community:comment', postId, comment: publicComment });
    return publicComment;
  }

  async support(postId: string, userId: string) {
    return communityRepository.transaction(async (transaction) => {
      const post = await transaction.trCommunityPost.findFirst({ where: { id: postId, isHidden: false }, select: { id: true } });
      if (!post) throw new Error('NOT_FOUND');
      const existing = await transaction.trCommunitySupport.findUnique({ where: { userId_postId: { userId, postId } } });
      if (existing) {
        const unchanged = await transaction.trCommunityPost.findUnique({ where: { id: postId } });
        return unchanged ? toPublicPost(unchanged, true) : null;
      }
      await transaction.trCommunitySupport.create({ data: { userId, postId } });
      const updated = await transaction.trCommunityPost.update({ where: { id: postId }, data: { supportCount: { increment: 1 } } });
      broadcast('community', { type: 'community:support', postId, supportCount: updated.supportCount });
      return toPublicPost(updated, true);
    });
  }

  async report(reporterId: string, body: CommunityReportDTO) {
    const target = body.targetType === 'POST'
      ? await communityRepository.communityPost.findUnique({ where: { id: body.targetId }, select: { id: true } })
      : await communityRepository.communityComment.findUnique({ where: { id: body.targetId }, select: { id: true } });
    if (!target) throw new Error('NOT_FOUND');
    const targetWhere = { reporterId, targetType: body.targetType, targetId: body.targetId };
    return communityRepository.communityReport.upsert({
      where: { reporterId_targetType_targetId: targetWhere },
      update: { reason: body.reason, details: body.details ?? null, status: 'OPEN', resolvedAt: null, postId: body.targetType === 'POST' ? body.targetId : null, commentId: body.targetType === 'COMMENT' ? body.targetId : null },
      create: { ...targetWhere, postId: body.targetType === 'POST' ? body.targetId : null, commentId: body.targetType === 'COMMENT' ? body.targetId : null, reason: body.reason, details: body.details ?? null },
    });
  }

  listReports(page: number, limit: number) {
    return communityRepository.communityReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        reporter: { select: { id: true, displayName: true, role: true } },
        post: { select: { id: true, content: true, isHidden: true } },
        comment: { select: { id: true, content: true, isHidden: true } },
      },
    });
  }

  async moderate(moderatorId: string, body: ModerationDTO) {
    return communityRepository.transaction(async (transaction) => {
      if (body.action === 'HIDE' || body.action === 'RESTORE') {
        const hidden = body.action === 'HIDE';
        if (body.targetType === 'POST') await transaction.trCommunityPost.update({ where: { id: body.targetId }, data: { isHidden: hidden } });
        else await transaction.trCommunityComment.update({ where: { id: body.targetId }, data: { isHidden: hidden } });
      }
      if (body.action === 'RESOLVE_REPORT' || body.action === 'DISMISS_REPORT') {
        if (!body.reportId) throw new Error('REPORT_REQUIRED');
        await transaction.trCommunityReport.update({
          where: { id: body.reportId },
          data: { status: body.action === 'RESOLVE_REPORT' ? 'RESOLVED' : 'DISMISSED', resolvedAt: new Date() },
        });
      }
      const audit = await transaction.trCommunityModerationAudit.create({
        data: { moderatorId, action: body.action, targetType: body.targetType, targetId: body.targetId, reportId: body.reportId ?? null, reason: body.reason },
      });
      broadcast('community', { type: 'community:moderated', targetType: body.targetType, targetId: body.targetId, action: body.action });
      return audit;
    });
  }
}

export default new CommunityService();
