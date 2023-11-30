DROP TABLE IF EXISTS recipe CASCADE;
DROP TABLE IF EXISTS chefs CASCADE;
DROP TABLE IF EXISTS users CASCADE;



CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);
insert into users (username, password) values 
                  ('andrew', '$2b$10$CVNZ5EENn7gCVTelNRvIh.3Sl02Js2Zzi6ODrReYBTISQGEL3PXqy') RETURNING *;

CREATE TABLE chefs (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE recipe (
    recipeName VARCHAR(255) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    instruction TEXT NOT NULL,
    ingredients TEXT[],
    quantity INT[],
    units TEXT[],
    uploadTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username)
);
