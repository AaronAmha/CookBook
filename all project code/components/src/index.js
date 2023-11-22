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
  username: undefined,
  recipeName: undefined,
  file_name: undefined,
  file_path: undefined,
  instruction: undefined,
  ingredients: undefined,
  quantity: undefined,
  units: undefined,
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
//   //do something
//   res.render("pages/login");
//   });
// // Login
// app.post('/login', async (req, res) => {

// try{
//     const {username, password} = req.body;
//     const search = "SELECT * FROM users WHERE username = $1";
//     const userExists = await db.oneOrNone(search, [username]);  

//     if (!userExists)
//     {
//       console.log(error);
//       res.redirect('/register');
//       return;
//     } 

//     const match = await bcrypt.compare(password, userExists.password);
//     if (!match)
//     {
//         // redirect to login page!!
//         console.log(error);
//         res.render('../views/pages/login', { message: 'Incorrect username or password.'});  
//         return;  
//     }
    
//     req.session.user = 
//     {
//       id: userExists.id, 
//       username: userExists.username,
//       first_name: userExists.first_name,
//       last_name: userExists.last_name,
//       email: userExists.email,
//       dob: userExists.dob
//     };
//     // req.session.user = user;
//     req.session.save();
//     res.redirect('/discover');
        

//   } catch(err)
//   {
//       // redirect them to the register page!!
//       console.log(err);
//       res.redirect('/register');
//   }






// app.get('/profile', (req, res) => {
//   //do something
//   res.render("pages/profile");
// });
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

  // const post = await query('INSERT INTO recipe (username, recipeName, file_name, file_path, instruction, uploadTime) VALUES ($1, $2, $3, $4, $5, $6)', [req.session.user.username, myrecipeName, myfile_name, myfile_path, myinstruction, time]);

  // if(post)
  // {
  //   res.render("pages/addRecipe", { message: "Your Recipe Has Succesfully Uploaded!"
  //   });
  // }
  try {
    const groceries = ingredients.map(item => item.ingredient);
    const number = ingredients.map(item => item.quantity);
    const type = ingredients.map(item => item.unit);

    // const recipePost = 'INSERT INTO recipe (username, recipeName, file_name, file_path, instruction, ingredients, quantity, units) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    const recipePost = await db.query('INSERT INTO recipe (username, recipeName, file_name, file_path, instruction, groceries, number, type, uploadTime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [req.session.user.username, myrecipeName, myfile_name, myfile_path, myinstruction, groceries, number, type, time]);
    res.send('Nice');
    // message: "Your Recipe Has Succesfully Uploaded";
  }catch (error) {
    console.error('nah', error);
  }
});

app.get('/myRecipes', async(req, res) => {
  //do something
  try
  {
    const allRecipes = await db.query('SELECT * FROM recipe ORDER BY uploadTime');
    
    if (allRecipes.rows.length > 0)
    {
      const recipes = allRecipes.rows;
      res.render("pages/myRecipes", { recipes });  
    }
    else {
      res.render("pages/myRecipes", { recipes: [] });
    }
  } catch(error) {
    console.error(error);
  }
});

// app.get('/myrecipe/:name', async(req, res) => {
//   //do something
//   const recipeName = req.params.name;
//   try
//   {
    
//     const recipe = await db.oneOrNone('SELECT * FROM recipe WHERE recipeName = $1', [recipeName]);

    

//     const entireRecipe = viewRecipe.ingredients.map((ingredient, index) => {
//       return {
//         ingredient: ingredient,
//         quantity: viewRecipe.quantity[index], 
//         unit: viewRecipe.units[index]
//       };
//     });
//     res.render("pages/myrecipe", { recipe, extendedIngredients: entireRecipe });  
//   }
//   catch(error) {
//     console.error(error);
//   }
// });
// app.post("/profile", asyc(req, res) => {
//   res.render('/profile', { 
//     first_name: req.session.chefProfile.first_name,
//     last_name: req.session.chefProfile.last_name,
//     email: req.session.chefProfile.email,
//     dob: req.session.chefProfile.dob,
//     username: req.session.chefProfile.username,
//   });
    // const username = req.params.username;
    // const sql = 'SELECT * FROM users WHERE username = ?';

    // db.query(sql, [username], (err, foundProfile) => {
    //   if (err) throw err;
    //   if (foundProfile.length > 0)
    //   {
    //     res.render('/profile', {user: foundProfile[0]})
    //   }
    // });
    // const  = {
    //   first_name: req.params.first_name,
    //   last_name: req.params.last_name,
    //   email: req.params.email,
    // }
    // res.render("pages/profile", {
    //   username: req.params.username,
    //   first_name: req.session.user.first_name,
    //   last_name: req.session.user.last_name

    // })
  //   const sql = 'SELECT * FROM users WHERE username = ?';
  //   db.one(sql, [req.session.username], (error, found) => {
  //     if(error) throw err;

  //     if (found.length > 0) {
  //       res.render('/profile', { user: found[0] });
      
  //   }
  // })
  // res.render('/pages/profile', {
  //   username: req.session.user.username,
  //   first_name: req/session.user.first_name,
  //   last_name: req.session.user.last_name,
  //   email: req.session.user.email,
  //   dob: req.session.user.dob,
  // });   

/*
app.post("/login", (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const query = "select * from students where students.email = $1";
  const values = [email];
/ get the student_id based on the emailid
  db.one(query, values)
    .then((data) => {
      user.student_id = data.student_id;
      user.username = username;
      user.first_name = data.first_name;
      user.last_name = data.last_name;
      user.email = data.email;
      user.year = data.year;
      user.major = data.major;
      user.degree = data.degree;

      req.session.user = user;
      req.session.save();

      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/login");
    });
});

// Authentication middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

app.use(auth);

app.get("/", (req, res) => {
  res.render("pages/home", {
    username: req.session.user.username,
    first_name: req.session.user.first_name,
    last_name: req.session.user.last_name,
    email: req.session.user.email,
    year: req.session.user.year,
    major: req.session.user.major,
    degree: req.session.user.degree,
  });
});
*/

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


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');