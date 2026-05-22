import { parseMovieRows } from './import-movielens';

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
});
