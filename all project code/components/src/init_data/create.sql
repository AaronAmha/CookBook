DROP TABLE IF EXISTS reviews_to_recipes CASCADE;
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS chefs CASCADE;
DROP TABLE IF EXISTS users CASCADE;



CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(200) NOT NULL,
    comments VARCHAR(200)
);
-- insert into users (username, password) values 
--                   ('andrew', '$2b$10$CVNZ5EENn7gCVTelNRvIh.3Sl02Js2Zzi6ODrReYBTISQGEL3PXqy') RETURNING *;

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
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    image_url VARCHAR(255) 
);
-- reviews table
CREATE TABLE IF NOT EXISTS review (
   review_id SERIAL PRIMARY KEY NOT NULL,
   username VARCHAR(100),
   review VARCHAR(200),
   rating DECIMAL NOT NULL
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

-- INSERT INTO chefs (username, password, first_name, last_name, email, dob, profilePic) VALUES

