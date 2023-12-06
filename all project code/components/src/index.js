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

const multer = require('multer');
const path = require('path');

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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

/*
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
*/


app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login", {
    message: "Logged Out Successfully!"
  });
});

/*app.get('/discover', async (req, res) => {
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
});*/

app.get('/discover', async (req, res) => {
  try {
    // Fetch recipes from the API
    await getApiRecipes(req.query.query || '');

    // Fetch all recipes from the database
    const allRecipes = await db.any('SELECT * FROM recipes');

    res.render('pages/discover', { recipes: allRecipes });
  } catch (error) {
    console.error(error);
    res.render('pages/discover', { recipes: [], error: 'Error fetching recipes' });
  }
});


/*async function getApiRecipes(query) {
  try {
    const response = await axios({
      url: 'https://api.spoonacular.com/recipes/complexSearch',
      method: 'GET',
      params: {
        apiKey: process.env.API_KEY,
        query: query,
        number: 1, // Adjust the number of recipes you want to fetch
      },
    });

    const apiRecipes = response.data.results;

    // Insert or update the recipes in your database
    await Promise.all(apiRecipes.map(async (recipe) => {
      try {
        // Here you can add logic to check if the recipe already exists in the database
        // to avoid duplicates
        await db.none('INSERT INTO recipes (recipe_id, title) VALUES ($1, $2) ON CONFLICT (recipe_id) DO NOTHING', [recipe.id, recipe.title]);
      } catch (error) {
        console.error(`Error handling recipe "${recipe.title}":`, error);
      }
    }));

    return apiRecipes;
  } catch (error) {
    console.error('Error fetching recipes from API:', error);
    return []; // Return an empty array in case of error
  }
}*/

async function getApiRecipes(query) {
  try {
    const response = await axios({
      url: 'https://api.spoonacular.com/recipes/complexSearch',
      method: 'GET',
      params: {
        apiKey: process.env.API_KEY,
        query: query,
        number: 1, // Adjust the number of recipes you want to fetch
        addRecipeInformation: true, // This will include image URLs in the response
      },
    });

    const apiRecipes = response.data.results;

    // Insert or update the recipes in your database
    await Promise.all(apiRecipes.map(async (recipe) => {
      try {
        // Now include the image URL in your insert/update query
        await db.none('INSERT INTO recipes (recipe_id, title, image) VALUES ($1, $2, $3) ON CONFLICT (recipe_id) DO UPDATE SET title = $2, image = $3', [recipe.id, recipe.title, recipe.image]);
      } catch (error) {
        console.error(`Error handling recipe "${recipe.title}":`, error);
      }
    }));

    return apiRecipes;
  } catch (error) {
    console.error('Error fetching recipes from API:', error);
    return []; // Return an empty array in case of error
  }
}






app.get('/addRecipe', async (req, res) => {
  res.render('pages/addRecipe');
});





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


app.post('/addRecipe', upload.single('image'), async (req, res) => {
  const { name, ingredients, instructions } = req.body;
  const image = req.file ? req.file.filename : null; // Only store the file name
  const likeState = 0; // Default like state
  const likes = 0; // Default number of likes

  try {
      const insertQuery = `
          INSERT INTO recipes (title, ingredients, instructions, image, likeState, likes)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING recipe_id;`;

      const result = await db.one(insertQuery, [name, ingredients, instructions, image, likeState, likes]);
      res.redirect(`/discover`);
  } catch (error) {
      console.error('Error adding recipe:', error);
      res.render('pages/addRecipe', { message: 'Failed to add recipe. Please try again.' });
  }
});




// Sample route to retrieve and display recipe details

/*app.get('/recipe/:id', async (req, res) => {
  const recipeId = req.params.id;

  try {
    const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
      params: {
        includeNutrition: false, // Adjust as needed
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
}); */

app.get('/recipe/:id', async (req, res) => {
  const recipeId = req.params.id;
  console.log("Requested recipe ID:", recipeId);

  try {
    let recipeInfo = await db.oneOrNone('SELECT * FROM recipes WHERE recipe_id = $1', [recipeId]);
    console.log("Recipe info from DB:", recipeInfo);

    // Check if the essential details are null and fetch from API if they are
    if (!recipeInfo || recipeInfo.ingredients === null || recipeInfo.instructions === null) {
      console.log("Fetching recipe from API...");
      const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
        params: {
          includeNutrition: false,
          apiKey: process.env.API_KEY,
        },
      });
      recipeInfo = response.data;
      console.log("Recipe info from API:", recipeInfo);
    }

    const comments = await db.any('SELECT * FROM reviews WHERE recipe_id = $1', [recipeId]);
    console.log("Comments:", comments);

    // Now ensure that recipeInfo has the necessary fields for your template
    // If certain fields are expected to be arrays, make sure to provide them as arrays
    recipeInfo.ingredients = recipeInfo.ingredients || [];
    recipeInfo.instructions = recipeInfo.instructions || [];

    const data = {
      recipeInfo: recipeInfo,
      comments: comments
    };
    
    res.render('pages/recipe', { data: data });
  } catch (error) {
    console.error("Error in /recipe/:id route:", error);
    res.render('pages/recipe', { data: { recipeInfo: {}, comments: [] }, error: 'Failed to load recipe details.' });
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