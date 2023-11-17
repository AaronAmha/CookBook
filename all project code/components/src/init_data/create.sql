DROP TABLE IF EXISTS users  CASCADE;
CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);

insert into users (username, password) values 
("andrew", "$2b$10$CVNZ5EENn7gCVTelNRvIh.3Sl02Js2Zzi6ODrReYBTISQGEL3PXqy") returning * ;
