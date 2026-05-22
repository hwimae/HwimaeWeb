import { importMoviesFromCsv, parseMovieRows } from './import-movielens';

describe('parseMovieRows', () => {
  it('parses MovieLens movie rows into movies with years and genres', () => {
    const csv = [
      'movieId,title,genres',
      '1,Toy Story (1995),Adventure|Animation|Children',
      '2,Jumanji (1995),Adventure|Children|Fantasy',
    ].join('\n');

    expect(parseMovieRows(csv)).toEqual([
      {
        movielensId: 1,
        title: 'Toy Story',
        releaseYear: 1995,
        genres: ['Adventure', 'Animation', 'Children'],
      },
      {
        movielensId: 2,
        title: 'Jumanji',
        releaseYear: 1995,
        genres: ['Adventure', 'Children', 'Fantasy'],
      },
    ]);
  });

  it('keeps movies without a release year and skips placeholder genres', () => {
    const csv = ['movieId,title,genres', '3,Unknown Movie,(no genres listed)'].join('\n');

    expect(parseMovieRows(csv)).toEqual([
      {
        movielensId: 3,
        title: 'Unknown Movie',
        releaseYear: undefined,
        genres: [],
      },
    ]);
  });

  it('imports parsed movies through the provided Prisma client', async () => {
    const prisma = {
      movie: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    } as any;
    const csv = ['movieId,title,genres', '1,Toy Story (1995),Adventure|Animation'].join('\n');

    await importMoviesFromCsv(prisma, csv);

    expect(prisma.movie.upsert).toHaveBeenCalledWith({
      where: { movielensId: 1 },
      create: {
        movielensId: 1,
        title: 'Toy Story',
        releaseYear: 1995,
        genres: {
          create: [
            { genre: { connectOrCreate: { where: { name: 'Adventure' }, create: { name: 'Adventure' } } } },
            { genre: { connectOrCreate: { where: { name: 'Animation' }, create: { name: 'Animation' } } } },
          ],
        },
      },
      update: {
        title: 'Toy Story',
        releaseYear: 1995,
      },
    });
  });
});
