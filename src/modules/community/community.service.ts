import communityRepository from '@/modules/community/community.repository.js';
import type { CreateCommunityPostDTO } from '@/modules/community/community.validation.js';
import { broadcast } from '@/modules/realtime/realtime.js';
import { richTextToPlainText, sanitizeRichText } from '@/utils/html.util.js';

class CommunityService {
  async list(cursor?: string, limit = 10, userId?: string) {
    const posts = await communityRepository.communityPost.findMany({
      where: { isHidden: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { comments: { orderBy: { createdAt: 'asc' }, take: 5 }, supports: userId ? { where: { userId }, select: { id: true } } : false },
    });

    return posts.map((post) => ({ ...post, likedByMe: userId ? post.supports.length > 0 : false, supports: undefined }));
  }

  async create(body: CreateCommunityPostDTO) {
    const content = sanitizeRichText(body.content);
    if (!richTextToPlainText(content)) throw new Error('Post content is required');
    const post = await communityRepository.communityPost.create({
      data: {
        alias: body.alias,
        content,
        imageUrl: body.imageUrl ?? null,
        mood: body.mood ?? null,
        ...(body.userId ? { user: { connect: { id: body.userId } } } : {}),
      },
    });
    broadcast('community', { type: 'community:post', post });
    return post;
  }

  async comment(id: string, body: { userId?: string | undefined, content: string, imageUrl?: string | undefined }) {
    const comment = await communityRepository.communityComment.create({
      data: {
        postId: id,
        userId: body.userId ?? null,
        alias: 'Anonymous',
        content: body.content,
        imageUrl: body.imageUrl ?? null,
      },
    });
    broadcast('community', { type: 'community:comment', postId: id, comment });
    return comment;
  }

  async support(id: string, userId: string) {
    const support = await communityRepository.communitySupport.findUnique({ where: { userId_postId: { userId, postId: id } } });
    if (support) return communityRepository.communityPost.findUnique({ where: { id } });

    await communityRepository.communitySupport.create({ data: { userId, postId: id } });
    const post = await communityRepository.communityPost.update({ where: { id }, data: { supportCount: { increment: 1 } } });
    broadcast('community', { type: 'community:support', postId: id, supportCount: post.supportCount, userId });
    return post;
  }
}

export default new CommunityService();
