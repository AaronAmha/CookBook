DROP TABLE IF EXISTS reviews_to_recipes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS chefs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS likes CASCADE;


CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(200) NOT NULL,
    comments VARCHAR(200)
);

--insert into users (username, password) values 
--('andrew', '$2b$10$CVNZ5EENn7gCVTelNRvIh.3Sl02Js2Zzi6ODrReYBTISQGEL3PXqy');

CREATE TABLE chefs (
    chefID SERIAL PRIMARY KEY,
    username VARCHAR(50),
    password CHAR(60) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    profilePic VARCHAR(255),
    FOREIGN KEY (username) REFERENCES users(username)
    
);


CREATE TABLE recipes (
    recipe_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    ingredients TEXT,
    instructions TEXT,
    image VARCHAR(255),
    likes INT,
    customRecipe INT
);
-- reviews table
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    review_text VARCHAR(100),
    username VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,
    recipe_id INT REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE likes (
    username VARCHAR(50) REFERENCES users(username) on delete CASCADE,
    likeState INT,
    recipe_id INT REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE favorites (
    username VARCHAR(50) REFERENCES users(username) on delete CASCADE,
    recipe_id INT REFERENCES recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE reviews_to_recipes (
    recipe_id INT,
    review_id INT,
    FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES reviews (review_id) ON DELETE CASCADE
);
INSERT INTO users (username, password) VALUES
    ('andrew', '$2b$10$CVNZ5EENn7gCVTelNRvIh.3Sl02Js2Zzi6ODrReYBTISQGEL3PXqy'),
    ('alice', '$2b$10$SomeRandomHashAlice'),
    ('bob', '$2b$10$SomeRandomHashBob'),
    ('charlie', '$2b$10$SomeRandomHashCharlie'),
    ('diana', '$2b$10$SomeRandomHashDiana'),
    ('eve', '$2b$10$SeRandomHashDiana');