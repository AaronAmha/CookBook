DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);

DROP TABLE IF EXISTS recipes CASCADE;
CREATE TABLE recipes (
    recipe_id INT NOT NULL,
    title VARCHAR(200),
    PRIMARY KEY (recipe_id)
);
-- Create users and recipes tables first
-- Then, create the reviews table with foreign key constraints
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    review_text VARCHAR(100),
    username VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,
    recipe_id INT REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS reviews_to_recipes CASCADE;
CREATE TABLE reviews_to_recipes (
    recipe_id INT,
    review_id INT,
    FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES reviews (review_id) ON DELETE CASCADE
);
