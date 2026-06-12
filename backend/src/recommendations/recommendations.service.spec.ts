import { createRecommendationsService } from './recommendations.service';

const candidateRows = [
  {
    storyId: 'story-1',
    title: 'Tu Tiên Ký',
    authors: 'Tác giả A',
    category: 'Tiên hiệp',
    averageRating: 4.8,
    reviewCount: 120,
    chunkContent: 'Thiếu niên yếu ớt bước vào con đường tu luyện và dần mạnh lên.',
    distance: 0.1,
  },
  {
    storyId: 'story-1',
    title: 'Tu Tiên Ký',
    authors: 'Tác giả A',
    category: 'Tiên hiệp',
    averageRating: 4.8,
    reviewCount: 120,
    chunkContent: 'Nhân vật chính vượt qua thử thách trong môn phái.',
    distance: 0.2,
  },
  {
    storyId: 'story-2',
    title: 'Đấu Trí Thành Chủ',
    authors: 'Tác giả B',
    category: 'Huyền huyễn',
    averageRating: 4.5,
    reviewCount: 80,
    chunkContent: 'Các thế lực đấu trí để giành quyền kiểm soát thành trì.',
    distance: 0.25,
  },
];

describe('listPopularRecommendations', () => {
  it('queries and maps popular stories using app user review aggregates', async () => {
    const story = {
      id: 'story-10',
      title: 'Kiếm Lộ',
      authors: 'Tác giả C',
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Tiên hiệp' },
      userAverageRating: 4.7,
      userReviewCount: 321,
      externalAverageRating: 4.9,
      externalReviewCount: 9999,
    };

    const prisma = {
      story: {
        findMany: jest.fn().mockResolvedValue([story]),
      },
    };
    const service = createRecommendationsService({ prisma } as never);
    const query = { limit: 5 };

    const result = await service.listPopularRecommendations(query);

    expect(prisma.story.findMany).toHaveBeenCalledWith({
      where: { userAverageRating: { gt: 0 }, userReviewCount: { gt: 0 } },
      include: { category: true },
      orderBy: [{ userReviewCount: 'desc' }, { userAverageRating: 'desc' }, { title: 'asc' }],
      take: query.limit,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        storyId: 'story-10',
        averageRating: story.userAverageRating,
        reviewCount: story.userReviewCount,
      }),
    );
    expect(result.items[0].reason).toContain('review từ người dùng app');
  });
});

describe('askStoryAdvisor', () => {
  it('groups vector matches by story and asks AI for an answer', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue(candidateRows),
    };
    const aiClient = {
      embedText: jest.fn().mockResolvedValue(Array.from({ length: 384 }, () => 0.01)),
      generateAdvisorAnswer: jest.fn().mockResolvedValue('Bạn nên thử Tu Tiên Ký.'),
    };
    const service = createRecommendationsService({ prisma, aiClient } as never);

    const result = await service.askStoryAdvisor({ query: 'main yếu thành mạnh', limit: 2 });

    expect(result.answer).toBe('Bạn nên thử Tu Tiên Ký.');
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0].storyId).toBe('story-1');
    expect(result.recommendations[0].reason).toContain('Nội dung gần với yêu cầu');

    const sql = (prisma.$queryRaw.mock.calls[0]?.[0] as TemplateStringsArray).join('?');
    expect(sql).toContain('s."contentPath" IS NOT NULL');
    expect(sql).toContain('s."contentIndexedAt" IS NOT NULL');
    expect(sql).toContain('s."contentUpdatedAt" IS NOT NULL');
    expect(sql).toContain('s."contentIndexedAt" >= s."contentUpdatedAt"');
    expect(sql).not.toContain('s."contentUpdatedAt" IS NULL');

    expect(aiClient.generateAdvisorAnswer).toHaveBeenCalledWith({
      query: 'main yếu thành mạnh',
      contexts: expect.arrayContaining([
        expect.objectContaining({ storyId: 'story-1', title: 'Tu Tiên Ký' }),
        expect.objectContaining({ storyId: 'story-2', title: 'Đấu Trí Thành Chủ' }),
      ]),
    });
  });

  it('returns a deterministic fallback answer when LLM fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue(candidateRows.slice(0, 1)),
    };
    const aiClient = {
      embedText: jest.fn().mockResolvedValue(Array.from({ length: 384 }, () => 0.01)),
      generateAdvisorAnswer: jest.fn().mockRejectedValue(new Error('Gemini is not available')),
    };
    const service = createRecommendationsService({ prisma, aiClient } as never);

    const result = await service.askStoryAdvisor({ query: 'tu tiên', limit: 1 });

    expect(result.answer).toBe('Mình tìm được 1 truyện có nội dung gần với yêu cầu của bạn. Bạn có thể mở từng truyện để đọc chi tiết hơn.');
    expect(result.recommendations).toHaveLength(1);
  });
});
