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

// File System and Upload Modules
const fs = require('fs');
const fileUpload = require('express-fileupload');
app.use(fileUpload());
//middlewares
// const fileUpload = require('express-fileupload');
// const multer = require('multer');
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
  // first_name: undefined,
  // last_name: undefined,
  // email: undefined,
  // dob: undefined
};
const chef = {
  username: undefined,
  password: undefined,
  first_name: undefined,
  last_name: undefined,
  email: undefined,
  dob: undefined
};

const recipe = {
  recipe_id: undefined,
  username: undefined,
  recipe_name: undefined,
  file_name: undefined,
  file_path: undefined,
  instruction: undefined,
  ingredients:[],
  quantity: [],
  units: [],
  uploadTime: undefined
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


  // const gallery = multer.diskStorage
  // ({
  //     destination: function(req,file, cb) 
  //     {

  //     }
  // })
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

// app.use(fileUpload());
// app.use(express.static('../all project code/components/src/views/pages'));

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


app.get('/addRecipe', (req, res) => {
  res.render("pages/addRecipe");
});
app.post('/addRecipe', async(req, res) => {
  const {name, instructions, ingredientCount} = req.body;
  let ingredients = [];

  for (let x = 0; x < ingredientCount; x++)
  {
    let ingredient = req.body["ingredient_" + x];
    let quantity = req.body["quantity_" + x];
    let unit = req.body["unit_" + x];
    
    if (ingredient && quantity && unit)
    {
      ingredients.push({ingredient, quantity, unit});
    }
  }

  // https://pqina.nl/blog/upload-image-with-nodejs/

  console.log(req.files);
  const image = req.files.image;
  if (!image) 
  {
    return res.sendStatus(400);
  }
  
  // Only images
  // if (!/^image/.test(image.mimetype)) return res.sendStatus(400);

  // // Move image to uploads folder
  const uploadPath = __dirname + '/uploads/';
  if (!fs.existsSync(uploadPath)){
    fs.mkdirSync(uploadPath);
  }
  image.mv(uploadPath + image.name);

  const myrecipeName = name;
  const myinstruction = instructions;
  const myfile_path = uploadPath + image.name;
  const myfile_name = image.name;
  const time = new Date().toISOString();
 

  try {
    const groceries = ingredients.map(item => item.ingredient);
    const number = ingredients.map(item => item.quantity);
    const type = ingredients.map(item => item.unit);


    const recipe = {
      username: req.session.user.username,
      recipe_name: myrecipeName,
      file_name: myfile_name,
      file_path: myfile_path,
      instruction: myinstruction,
      ingredients: groceries,
      quantity: number,
      units: type,
      uploadTime: time
    };
    // const recipePost = 'INSERT INTO recipe (username, recipeName, file_name, file_path, instruction, ingredients, quantity, units) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    const recipePost = await db.query('INSERT INTO recipes (recipe_name, username, file_name, file_path, instruction, ingredients, quantity, units, uploadTime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [myrecipeName, req.session.user.username, myfile_name, myfile_path, myinstruction, groceries, number, type, time]);
    res.redirect('/discover');
    // message: "Your Recipe Has Succesfully Uploaded";
  }catch (error) {
    console.error('nah', error);
  }
});

// app.get('/myRecipes', async(req, res) => {
//   //do something
//   try
//   {
//     const allRecipes = await db.query('SELECT * FROM recipes ORDER BY uploadTime');
    
//     if (allRecipes.rows > 0)
//     {
//       const recipes = allRecipes.rows;
//       res.render("pages/myRecipes", { recipes });  
//     }
//     else {
//       res.render("pages/myRecipes", { recipes: [] });
//     }
//   } catch(error) {
//     console.error(error);
//   }
// });
// app.get('/myRecipes', async(req, res) => {
//   //do something
//   try
//   {
//     const myRecipes = await db.query('SELECT * FROM recipes');
//     if myRecipes
//     res.render("pages/myRecipes", { recipe: myRecipes.rows});  
//   }
//   catch(error) {
//     console.error(error);
//   }
// });
app.get('/myRecipes', async(req, res) => {
  try {
     const food = 'SELECT * FROM recipes';
     const feel = await db.query(food, (err, data) => { 
        if (err) throw err;
        res.render('pages/myRecipes', { username: req.session.user.username, grubb: data});
  })
    }catch(error) {
          console.error(error);
    }
  });



  // try {
  //   const food = await db.query('SELECT * FROM recipes');
  //   if (food.rows > 0) {
  //     res.render("pages/myRecipes", { recipes: food.rows });
  //   } else {
  //     res.render("pages/myRecipes", { recipes: [] });
  //   }
  // } catch(error) {
  //   console.error(error);
  //   res.status(500).send('Server Error');
  // }



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

// Comment section
app.post('/recipe/:id/comment', async (req, res) => {
  const recipeId = req.params.id;
  const { comment } = req.body;

  try {
    console.log("added a comment");
    const reviewQuery = await db.query('INSERT INTO reviews (recipe_id, review_text) VALUES ($1, $2) RETURNING review_id', [recipeId, comment]);
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