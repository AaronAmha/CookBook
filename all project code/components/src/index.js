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
   const hash = await bcrypt.hash(req.body.password, 10);
   // To-DO: Insert username and hashed password into the 'users' table
   try 
   {
       const query = await db.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [req.body.username, hash]);
       res.redirect('/login');
   } catch (error)
   {
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
// Login
app.post('/login', async (req, res) => {
  // const user = await db.query('SELECT password FROM users WHERE username = $1', [req.body.username]);   
// }
// Use bcrypt.compare to encrypt the password entered from the
// user and compare if the entered password is the same as the 
// registered one. This function returns a boolean value.
  try
  {
      const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [req.body.username]);   
      const match = await bcrypt.compare(req.body.password, user.password);
      if (!match)
      {
          // redirect to login page!!
          res.render('../views/pages/login', { message: 'Incorrect username or password.'});    
      }
      else
      {
          req.session.user = user;
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
// check if password from request matches with password in DB
// const username = req.body.username;
// const query = "select * from users where users.username = $1";
// user.password = '';
// await db.one(query, [
//   username,
// ])
//   // if query execution succeeds
//   // send success message
//   .then(function (data) {
  
//     user.password = data.password;
//     user.username = username;
//   })
//   // if query execution fails
//   // send error message
//   .catch(function (err) {
//     res.redirect("/register");
//     return console.log(err);
//   });
//   const match = await bcrypt.compare(req.body.password, user.password);
//   if (!match)
//   {
//     res.render("pages/login", {
//       message: "Incorrect Username or Password",
//       error: true});
//   }
//   else
//   {
//     req.session.user = user;
//     req.session.save();
//     res.redirect("/discover");
//   }
// });

// Authentication Middleware.
const auth = (req, res, next) => {
if (!req.session.user) {
  // Default to login page.
  return res.redirect('/login');
}
next();
};
//authentication required
app.use(auth);


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
        number: 10,
      },
    });
    const results = response.data.results;
    console.log(results);

    res.render('pages/discover', { recipes: results, userQuery });
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

// Configure Multer to handle file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: function(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// POST route for adding a recipe
app.post('/addRecipe', upload.single('image'), async (req, res) => {
    const { name, ingredients, instructions } = req.body;
    const image = req.file ? req.file.filename : null; // Only store the file name or a reference in the database

    try {
        const insertQuery = `
            INSERT INTO recipes (name, ingredients, instructions, image)
            VALUES ($1, $2, $3, $4)
            RETURNING id;`;

        // Execute the insert query with the form data
        const result = await db.one(insertQuery, [name, ingredients, instructions, image]);

        // Redirect to the 'discover' page with the new recipe id
        res.redirect(`/discover?query=${name}`);
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.render('pages/addRecipe', { message: 'Failed to add recipe. Please try again.' });
    }
});




// Sample route to retrieve and display recipe details
app.get('/recipe/:id', async (req, res) => {
  const recipeId = req.params.id;

  try {
    const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
      params: {
        includeNutrition: false, // Adjust as needed
        apiKey:  process.env.API_KEY,
      },
    });

    const recipeInfo = response.data;
    res.render('pages/recipe', { recipeInfo });
  } catch (error) {
    console.error(error);
    res.render('pages/recipe', { recipes: [], error: 'API call failed' });
  }
});


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');