-- CreateIndex
CREATE INDEX "movie_genres_genreId_idx" ON "movie_genres"("genreId");

-- CreateIndex
CREATE INDEX "ratings_movieId_idx" ON "ratings"("movieId");
