DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
    --comments VARCHAR(200),
);

-- DROP TABLE IF EXISTS review CASCADE;
-- CREATE TABLE IF NOT EXISTS review (
--   review_id SERIAL PRIMARY KEY NOT NULL,
--   username VARCHAR(100),
--   review VARCHAR(200),
--   rating DECIMAL NOT NULL
-- );

-- DROP TABLE IF EXISTS users CASCADE;
-- CREATE TABLE review_to_users (
--   review_id INT NOT NULL,
--   FOREIGN KEY (review_id) REFERENCES reviews (review_id) ON DELETE CASCADE
-- );

insert into users (username, password) values 
("andrew", "password") returning * ;
