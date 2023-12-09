<h1 align = 'center'> Welcome To CookBook 📖👋 </h1>

<p align='center'> 
  💻 CSCI 3308 Recitation 16 - Group 04 Project 
</p>




👥 Contributors
-------------

- 👨‍🍳 [Aaron Amha](https://github.com/AaronAmha)
- 👨‍🍳 [Alex Foucher](https://github.com/AlexFoucher)
- 👨‍🍳 [Michael Dempsey](https://github.com/mide5396)
- 👩‍🍳 [Sarah Sharroufna](https://github.com/SarahSharroufna)

📋 Table of contents
-----------------

* [Brief Application Description ](#-brief-application-description-introduction)
* [Technology Stack](#tech-stack)
* [Prerequisites - Installations](#%EF%B8%8F-installation)
* [Instructions](#-instructions)
* [How To Run Tests](#-running-tests)
* [Deployed Application Link](#-links)

📝 #Brief Application Description (Introduction) 
------------
The CookBook project is designed to serve as a social media platform inspired by the most successful social media ever, Facebook. It caters to users interested in cooking and offers seven features aimed at enhancing user quality of life and functionality.

The first feature is the login page, which serves as a check to determine whether the user has created an account or not. If they have, they are redirected to our 'discover' page. If not, they are directed to the registration page, where they can create a personal account with a securely hashed password for protection.

Upon logging in, users are directed to the discover page, which showcases recipes from the Spoonacular API and recipes created by the user. Here, users can also favorite recipes, which are then stored on their 'favorites' page for easy access.

Another notable feature is the 'addRecipe' page, allowing users to contribute their own recipes to the discover page. This encourages culinary enthusiasts to share their creative ideas with the community.

The 'View Recipe' page is where users can engage with recipes by commenting, liking, and viewing detailed instructions, fostering a sense of community and interaction.

Lastly, the project includes a logout button, which allows users to securely log out of their accounts on the website.

In summary, CookBook provides a platform for foodies and culinary enthusiasts to come together, share ideas, and interact with recipes, all while drawing inspiration from the success of Facebook's social media model. Users have personalized profiles showcasing their contributions and favorite recipes, creating a vibrant culinary community.


## 📱Tech Stack

**Client:**

**npm:** As a package manager to manage dependencies.

**Server:** 

**Node.js with Express:** Express helps in building the application servers, managing routes, and handling API requests.

**PostgreSQL:** Our primary database, chosen for robustness and reliability. Integrated with Node.js using **pg-promise.**

**EJS (Embedded JavaScript):** Employed as the view engine for rendering dynamic HTML pages.

**express-session:** Responsible For User Data And Access

**bcrypt:** Password Hashing and Verification

**axios:**  To make HTTP requests from our server.

**multer:** A middleware primarily used for file uploads.

**path:** Node.js module for handling file and directory paths.

**body-parser:** Parses incoming request bodies, making form data available under req.body.







### API Reference

| Parameter | Type     | Description                |  API_KEY:                          |
| :-------- | :------- | :------------------------- | :------------------------- |
| `api_key` | `string` | **Required**. Your API key: | '9f0030ca898f4fdbbb89b618bb69f224'|
| `api_key` | `string` | **Required**. Your API key: | 'cb662f80ff4e4e78bad13c787c637a1e'|



## ⚙️ Installation

Install CookBook with npm

```bash
                            Import Dependencies
=====================================================================
const express = require('express'); 
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session'); 
const bcrypt = require('bcrypt');
const axios = require('axios'); 
const multer = require('multer');
const path = require('path');

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```
```bash
            App Settings
======================================
app.set('view engine', 'ejs'); 
app.use(bodyParser.json());
// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    query : ""
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
```

```bash
                Docker Compose
====================================================
version: '3.9'
services:
  db:
    image: postgres:14
    env_file: .env
    expose:
      - '5432'
    volumes:
      - group-project:/var/lib/postgresql/data
      - ./init_data:/docker-entrypoint-initdb.d
  web:
    image: node:lts
    user: 'node'
    working_dir: /home/node/app
    env_file: .env
    environment:
      - NODE_ENV=development
    depends_on:
      - db
    ports:
      - '3000:3000'
    volumes:
      - .:/home/node/app
    command: 'npm run testandrun'
volumes:
  group-project:
```

## 📋 Instructions

*   Clone The Repository: 

        git clone git@github.com:AaronAmha/CookBook.git

*   Change Directories To The SRC Folder

        cd all\ project\ code/components/src 

*   Run Docker Application, Then In IDE Terminal, Enter:

        docker-compose up -d

*   In Default Search Engine (Chrome, Edge), Run:

        http://localhost:3000/

*   Otherwise, application should be live on Microsoft Azure:

        Click On The Microsoft Azure Link: 

* [HERE](#-links)

        To Be Redirected 

## 🧪 Running Tests

To run tests, run the following command

```bash
  There are automated tests that run after running docker compose up -d from above. 
  These tests test the functionality for the login, discover, recipe, and profile pages

```


## 🔗 Links

**💻 Docker Compose**
[![Local](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](http://localhost:3000/)

**☁ Azure Cloud Deployment**
[![Azure Cloud Deployment ](https://img.shields.io/badge/microsoft%20azure-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)](http://recitation-16-team-4.eastus.cloudapp.azure.com:3000/)
