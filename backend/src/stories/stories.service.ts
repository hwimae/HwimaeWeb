import { Prisma } from '@prisma/client';
import type { BackendDeps } from '../dependencies';
import { notFound } from '../errors';
import type { ListStoriesQuery } from './stories.schema';

type StoryWithCategory = Prisma.StoryGetPayload<{ include: { category: true; content: { select: { id: true } } } }>;

export type StoryResponse = Omit<StoryWithCategory, 'category' | 'contentPath' | 'content'> & {
  category: string;
  hasContent: boolean;
};

export type ListStoriesResponse = {
  items: StoryResponse[];
  total: number;
  page: number;
  limit: number;
};

export type StoryContentResponse = {
  storyId: string;
  title: string;
  content: string;
};

export type StoriesService = {
  listStories(query: ListStoriesQuery): Promise<ListStoriesResponse>;
  getStoryById(id: string): Promise<StoryResponse>;
  getStoryContentById(id: string): Promise<StoryContentResponse>;
};

export function createStoriesService(deps: Pick<BackendDeps, 'prisma'>): StoriesService {
  return {
    async listStories(query) {
      const where: Prisma.StoryWhereInput = {
        ...(query.q
          ? {
              OR: [
                { title: { contains: query.q, mode: 'insensitive' } },
                { authors: { contains: query.q, mode: 'insensitive' } },
                { category: { name: { contains: query.q, mode: 'insensitive' } } },
              ],
            }
          : {}),
        ...(query.hasContent === true ? { content: { isNot: null } } : {}),
      };

      const [items, total] = await deps.prisma.$transaction([
        deps.prisma.story.findMany({
          where,
          include: { category: true, content: { select: { id: true } } },
          orderBy: [{ externalReviewCount: 'desc' }, { externalAverageRating: 'desc' }, { title: 'asc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        deps.prisma.story.count({ where }),
      ]);

      return { items: items.map(toStoryResponse), total, page: query.page, limit: query.limit };
    },

    async getStoryById(id) {
      const story = await deps.prisma.story.findUnique({ where: { id }, include: { category: true, content: { select: { id: true } } } });

      if (!story) {
        throw notFound('Story not found');
      }

      return toStoryResponse(story);
    },

    async getStoryContentById(id) {
      const storyContent = await deps.prisma.storyContent.findUnique({
        where: { storyId: id },
        include: { story: { select: { title: true } } },
      });

      if (!storyContent) {
        throw notFound('Story content not found');
      }

      return {
        storyId: storyContent.storyId,
        title: storyContent.story.title,
        content: storyContent.content,
      };
    },
  };
}

function toStoryResponse(story: StoryWithCategory): StoryResponse {
  const { category, contentPath: _contentPath, content, ...publicStory } = story;
  return { ...publicStory, category: category.name, hasContent: content !== null };
}
