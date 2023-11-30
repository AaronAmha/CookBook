// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.


// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

const user = {
  username: undefined,
  password: undefined
};

var testMessage = '';

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - Include your API routes here

app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
});

app.get("/", (req, res) => {
  res.redirect("/login");
});



app.get('/register', (req, res) => {

  res.render('pages/register');
});

// Register
app.post('/register', async (req, res) => {
   //hash the password using bcrypt library
   const {first_name, last_name, email, dob, username, password} = req.body;
   const hash = await bcrypt.hash(password, 10);
   
   // To-DO: Insert username and hashed password into the 'users' table
   try 
   {
      const user = await db.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, hash]);
      const chef = await db.query('INSERT INTO chefs (username, password, first_name, last_name, email, dob) VALUES ($1, $2, $3, $4, $5, $6) RETURNING * ', [username, hash, first_name, last_name, email, dob]);
      res.redirect('/login');
   } catch (error)
   {
      console.error(error);
      res.redirect('/register');
   }
 });
//   //hash the password using bcrypt library
//   const hash = await bcrypt.hash(req.body.password, 10);
//   const username = req.body.username;
//   const query = "INSERT INTO users (username, password) VALUES ($1, $2) returning * ;";

//   // To-DO: Insert username and hashed password into the 'users' table
//   db.any(query, [
//     username,
//     hash
//   ])
//     // if query execution succeeds
//     // send success message
//     .then(function (data) {
//       res.redirect("/login");
//     })
//     // if query execution fails
//     // send error message
//     .catch(function (err) {
//       res.redirect("/register");
//       return console.log(err);
//     });
// });

app.get('/login', (req, res) => {
  //do something
  res.render("pages/login");
  });
app.post('/login', async(req, res) => {
  try
  {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [req.body.username]);
    const chef = await db.oneOrNone('SELECT * FROM chefs WHERE username = $1', [req.body.username]);
    if (!user)
    {
      res.redirect('/register');
      return;
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match)
    {
        // redirect to login page!!
        res.render('../views/pages/login', { message: 'Incorrect username or password.'});    
    }
    else
    {
        req.session.user = user;
        req.session.chef = chef;
        req.session.save();
        res.redirect('/discover');
    }    
  // If the password is incorrect, throw an error stating
  // "Incorrect username or password."  
  }catch(err)
  {
      // redirect them to the register page!!
      console.log(err)
      res.redirect('/register');
  }
});
// Authentication Middleware.
const auth = (req, res, next) => {
if (!req.session.user) {
  // Default to login page.
  return res.redirect('/login');
}
next();
};
// //authentication required
app.use(auth);


app.get('/profile', async(req, res) => {
  //do something
  try
  {
    const myProfile = await db.oneOrNone('SELECT * FROM chefs WHERE username = $1', [req.session.user.username]);
    res.render("pages/profile", { chef: myProfile});  
  }
  catch(error) {
    console.error(error);
  }
});
// console.log(req.files);
//   const image = req.files.image;
//   if (!image) 
//   {
//     return res.sendStatus(400);
//   }
  
//   // Only images
//   // if (!/^image/.test(image.mimetype)) return res.sendStatus(400);

//   // // Move image to uploads folder
//   const uploadPath = __dirname + '/uploads/';
//   if (!fs.existsSync(uploadPath)){
//     fs.mkdirSync(uploadPath);
//   }
//   image.mv(uploadPath + image.name);

app.post('/uploadProfilePicture', async(req, res) => {
  try { 
    console.log(req.files);
    const image = req.files.image;
    if (!image) 
    {
      return res.sendStatus(400);
    }
    const uploadPath = __dirname + '/resources/profilePic/';
    if (!fs.existsSync(uploadPath)){
      fs.mkdirSync(uploadPath);
    }
      image.mv(uploadPath + image.name);

      // const imgPath = uploadPath + image.name;
      const pic = await db.query('UPDATE chefs SET profilePic = $1 WHERE username = $2', [uploadPath, req.session.user.username]);
      // req.session.chefs.profilePic = pic;
      // req.session.save();
      res.redirect('/profile');

  } catch (error) {
    console.error(error);
  }
});


app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login", {
    message: "Logged Out Successfully!"
  });
});

app.get('/discover', async (req, res) => {
  try {
    const userQuery = req.query.query || ''; // Retrieve the query parameter from the URL
    const response = await axios({
      url: 'https://api.spoonacular.com/recipes/complexSearch',
      method: 'GET',
      dataType: 'json',
      headers: {
        'Accept-Encoding': 'application/json',
      },
      params: {
        apiKey: process.env.API_KEY,
        query: userQuery,
        number: 1,
      },
    });
    const results = response.data.results;

    //console.log(results);

     // Use Promise.all to wait for all database insert operations to complete
    await Promise.all(results.map(async (recipe) => {
      try {
        const query = await db.query('INSERT INTO recipes (recipe_id, title) VALUES ($1, $2) RETURNING *', [recipe.id, recipe.title]);
        console.log(`Recipe "${recipe.title}" with id ${recipe.id} added to the database.`);
      } catch (error) {
        console.error(`Error adding recipe "${recipe.title}" or id ${recipe.id} to the database:`, error);
      }
    }));

    res.render('pages/discover', { recipes: results });
    
  } catch (error) {
    console.error(error);
    res.render('pages/discover', { recipes: [], error: 'API call failed' });
  }
});


app.get('/addRecipe', async (req, res) => {
    res.render('pages/addRecipe');
});


const multer = require('multer');
const path = require('path');


// Sample route to retrieve and display recipe details

app.get('/recipe/:id', async (req, res) => {
  const recipeId = req.params.id;

  try {
    const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
      params: {
        includeNutrition: false, // Adjust as needed
        apiKey: process.env.API_KEY,
        apiKey: process.env.API_KEY,
      },
    });

    const recipeInfo = response.data;

    console.log("selecting from database");
    //const comments = await db.query(`SELECT review_text AND username FROM reviews WHERE recipe_id = ${recipeId}`);
    const comments = await db.any(`SELECT * FROM reviews WHERE recipe_id = ${recipeId}`);
    
    const data = {
      "recipeInfo": recipeInfo,
      "comments": comments
    }
    console.log(data);
    // const commentsQuery = await db.query(
    //   'SELECT r.username, r.review_text FROM reviews r ' +
    //   'JOIN reviews_to_recipes rr ON r.review_id = rr.review_id ' +
    //   'WHERE rr.recipe_id = $1',
    //   [recipeId]
    // );

    //const comments = commentsQuery.rows;
    

    res.render('pages/recipe', { data: data });
  } catch (error) {
    console.error(error);
    res.render('pages/recipe', { recipes: [], error: 'API call failed' });
  }
});

// Comment section
app.post('/recipe/:id/comment', async (req, res) => {
  const recipeId = req.params.id;
  const review  = req.body.review;
  const username = req.body.username;
  
  try {
    const reviewQuery = await db.query('INSERT INTO reviews (recipe_id, review_text, username) VALUES ($1, $2, $3) RETURNING review_id', [recipeId, review, username]);
    const reviewId = reviewQuery[0].review_id;
    await db.query('INSERT INTO reviews_to_recipes (recipe_id, review_id) VALUES ($1, $2)', [recipeId, reviewId]);
    res.redirect(`/recipe/${recipeId}`);
  } catch (error) {
    console.log("did not add a comment");
    console.error(error);
    res.redirect(`/recipe/${recipeId}`);
  }
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');