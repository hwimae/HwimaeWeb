import { importReviewsFromCsv, parseReviewRows } from './import-comments';

const commentsCsv = [
  'product_id,comment_id,title,thank_count,customer_id,rating,content',
  '101,c-1,Hay,3,u-1,5,Nội dung comment',
].join('\n');

describe('parseReviewRows', () => {
  it('keeps CSV parsing available for offline analysis only', () => {
    expect(parseReviewRows(commentsCsv)).toEqual([
      {
        productId: 101,
        externalCommentId: 'c-1',
        title: 'Hay',
        thankCount: 3,
        externalCustomerId: 'u-1',
        rating: 5,
        content: 'Nội dung comment',
      },
    ]);
  });
});

describe('importReviewsFromCsv', () => {
  it('does not write dataset comments into database for MVP', async () => {
    const prisma = {
      story: { findUnique: jest.fn() },
      externalReview: { upsert: jest.fn(), aggregate: jest.fn() },
    };

    await expect(importReviewsFromCsv(prisma, commentsCsv)).resolves.toBe(0);
    expect(prisma.story.findUnique).not.toHaveBeenCalled();
    expect(prisma.externalReview.upsert).not.toHaveBeenCalled();
    expect(prisma.externalReview.aggregate).not.toHaveBeenCalled();
  });
});
