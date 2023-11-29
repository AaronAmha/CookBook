DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
    comments VARCHAR(200),
);

DROP TABLE IF EXISTS review CASCADE;
CREATE TABLE IF NOT EXISTS review (
   review_id SERIAL PRIMARY KEY NOT NULL,
   username VARCHAR(100),
   review VARCHAR(200),
   rating DECIMAL NOT NULL
 );

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE review_to_users (
   review_id INT NOT NULL,
   FOREIGN KEY (review_id) REFERENCES reviews (review_id) ON DELETE CASCADE
);

CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    image_url VARCHAR(255) 
);



insert into users (username, password) values 
("andrew", "$2b$10$CVNZ5EENn7gCVTelNRvIh.3Sl02Js2Zzi6ODrReYBTISQGEL3PXqy") returning * ;
