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
      generateAdvisorAnswer: jest.fn().mockRejectedValue(new Error('Ollama is not running')),
    };
    const service = createRecommendationsService({ prisma, aiClient } as never);

    const result = await service.askStoryAdvisor({ query: 'tu tiên', limit: 1 });

    expect(result.answer).toBe('Mình tìm được 1 truyện có nội dung gần với yêu cầu của bạn. Bạn có thể mở từng truyện để đọc chi tiết hơn.');
    expect(result.recommendations).toHaveLength(1);
  });
});
