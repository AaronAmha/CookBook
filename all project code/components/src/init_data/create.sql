DROP TABLE IF EXISTS users  CASCADE;
CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);

insert into users (username, password) values 
("andrew", "password") returning * ;
