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
    query : ""
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
   const hash = await bcrypt.hash(req.body.password, 10);
   
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

app.get('/favorite', async (req, res) => {
    const selectFav = "";
    var results = [];
    const getRecipeIDs = await db.query('select recipe_id from favorites');
    console.log(getRecipeIDs);
    const queryFav = await db.query('select * from recipes where recipe_id in (select recipe_id from favorites where username = $1)', [req.session.user.username]);
    console.log(queryFav);
    res.render('pages/favorite', { recipes: queryFav });
  });

app.post('/discover/favorite', async (req, res) =>{
    const recipe_id = req.body.favorite;
    console.log(recipe_id);
    const insertFav = "insert into favorites (username, recipe_id) values ($1, $2);";
    await db.one(insertFav, [req.session.user.username, recipe_id])
    .then(function (data){
      console.log("Inserted fav");
    })
    .catch(function (err){
      console.log("Couldn't insert");
      console.log(err);
    });
    res.redirect('/discover');
});

app.post('/discover/unfavorite', async (req, res) =>{
  const recipe_id = req.body.favorite;
  console.log(recipe_id);
  const deleteFav = "delete from favorites where recipe_id = $1 and username = $2;";
  await db.one(deleteFav, [recipe_id, req.session.user.username])
  .then(function (data){
    console.log("Deleted fav");
  })
  .catch(function (err){
    console.log("Couldn't delete");
    console.log(err);
  });
  res.redirect('/discover');
});

app.post('/favorite/unfavorite', async (req, res) =>{
  const recipe_id = req.body.favorite;
  var finalRecipe;
  console.log(recipe_id);
  const deleteFav = "delete from favorites where recipe_id = $1 and username = $2;";
  await db.one(deleteFav, [recipe_id, req.session.user.username])
  .then(function (data){
    console.log("Deleted fav");
  })
  .catch(function (err){
    console.log("Couldn't delete");
    console.log(err);
  });
  res.redirect('/favorite');
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
    //console.log(results);
    var favoriteState = 0;
    var finalResults = {};
    var recipes = [];
    var likeState;
    var likes;
    finalResults.recipes = recipes;
     // Use Promise.all to wait for all database insert operations to complete
    await Promise.all(results.map(async (recipe) => {
      try {
        const queryFav = await db.query('select count(recipe_id) from favorites where recipe_id=$1 and username=$2', [recipe.id, req.session.user.username]);
        try{
          const queryGetLike = await db.query('select likeState from likes where recipe_id=$1 and username=$2', [recipe.id, req.session.user.username]);
     
          likeState = queryGetLike[0].likestate;
        }
        catch(error)
        {
          likeState = 0;
        }

        try{
          const queryGetLikes = await db.query('select likes from recipes where recipe_id=$1', [recipe.id]);
     
          likes = queryGetLikes[0].likes;
        }
        catch(error)
        {
          likes = 0;
        }


        const getFavState = queryFav[0].count;
        favoriteState = getFavState;

        finalRecipe = {
          "title" : recipe.title,
          "id" : recipe.id,
          "image" : recipe.image,
          "favorite" : getFavState,
          "likes" : likes,
          "customRecipe" : 0
        }
        finalResults.recipes.push(finalRecipe);
        try {
          const query = await db.query('INSERT INTO recipes (recipe_id, title, image, likes, customRecipe) VALUES ($1, $2, $3, $4, $5) RETURNING *', [recipe.id, recipe.title, recipe.image, likes, 0]);
        }
        catch (err) {

        }
        
        const insertLikeState = await db.query('INSERT INTO likes (username, likeState, recipe_id) VALUES ($1, $2, $3) RETURNING *', [req.session.user.username, likeState, recipe.id]);
        //console.log(`Recipe "${recipe.title}" with id ${recipe.id} added to the database.`);
      } catch (error) {
        //console.error(`Error adding recipe "${recipe.title}" or id ${recipe.id} to the database:`, error);
      }
    }));

    try {
      const getCustomRecipe = await db.query('Select * from recipes where customRecipe=$1', [1]);
      console.log(getCustomRecipe.length);
      for (var i = 0; i < getCustomRecipe.length; i++)
      {
        console.log(getCustomRecipe[i]);
        var recipe = getCustomRecipe[i];
        const queryFavCustom = await db.query('select count(recipe_id) from favorites where recipe_id=$1 and username=$2', [recipe.id, req.session.user.username]);
        try{
          const queryGetLikeCustom = await db.query('select likeState from likes where recipe_id=$1 and username=$2', [recipe.id, req.session.user.username]);
     
          likeState = queryGetLikeCustom[0].likestate;
        }
        catch(error)
        {
          likeState = 0;
        }

        try{
          const queryGetLikesCustom = await db.query('select likes from recipes where recipe_id=$1', [recipe.id]);
     
          likes = queryGetLikesCustom[0].likes;
        }
        catch(error)
        {
          likes = 0;
        }


        const getFavStateCustom = queryFavCustom[0].count;
        favoriteState = getFavStateCustom;

        finalRecipe = {
          "title" : recipe.title,
          "id" : recipe.recipeId,
          "image" : recipe.image,
          "favorite" : favoriteState,
          "likes" : likes,
          "customRecipe" : 1
        }
        finalResults.recipes.push(finalRecipe);
        const insertLikeStateCustom = await db.query('INSERT INTO likes (username, likeState, recipe_id) VALUES ($1, $2, $3) RETURNING *', [req.session.user.username, likeState, recipe.id]);
      }
    }
    catch (err)
    {

    }


    console.log(finalResults);
    res.render('pages/discover', { recipes: finalResults});
    
  } catch (error) {
    console.error(error);
    res.render('pages/discover', { recipes: [], error: 'API call failed' });
  }
});*/

app.get('/discover', async (req, res) => {
  try {
    // Fetch recipes from the API
    await getApiRecipes(req.session.query || '', req);
    console.log(req.session.query);
    // Fetch all recipes from the database
    var allRecipes;

    if (req.session.query != null)
    {
      var string = "%" + req.session.query + "%";
      allRecipes = await db.any("SELECT * FROM recipes where UPPER(title) like UPPER($1) ORDER BY title ASC", [string]);
    }
    else
    {
      allRecipes = await db.any("SELECT * FROM recipes ORDER BY title ASC");
    }

    
    var favoriteState = 0;
    var finalResults = {};
    var recipes = [];
    var likeState;
    var likes;
    finalResults.recipes = recipes;
    for (var i = 0; i < allRecipes.length; i++)
    {
      var recipe = allRecipes[i];
      const queryFav = await db.query('select count(recipe_id) from favorites where recipe_id=$1 and username=$2', [recipe.recipe_id, req.session.user.username]);
      try{
        const queryGetLike = await db.query('select likeState from likes where recipe_id=$1 and username=$2', [recipe.recipe_id, req.session.user.username]);
   
        likeState = queryGetLike[0].likestate;
      }
      catch(error)
      {
        likeState = 0;
      }
  
      try{
        const queryGetLikes = await db.query('select likes from recipes where recipe_id=$1', [recipe.recipe_id]);
   
        likes = queryGetLikes[0].likes;
      }
      catch(error)
      {
        likes = 0;
      }
  
  
      const getFavState = queryFav[0].count;
      favoriteState = getFavState;
  
      finalRecipe = {
        "title" : recipe.title,
        "recipe_id" : recipe.recipe_id,
        "image" : recipe.image,
        "favorite" : getFavState,
        "likes" : likes,
        "customRecipe" : 0
      }
      finalResults.recipes.push(finalRecipe);
      
      const insertLikeState = await db.query('INSERT INTO likes (username, likeState, recipe_id) VALUES ($1, $2, $3) RETURNING *', [req.session.user.username, likeState, recipe.recipe_id]);
      
    }
    res.render('pages/discover', { recipes: finalResults.recipes, searchQuery : req.session.query });
  } catch (error) {
    console.error(error);
    res.render('pages/discover', { recipes: [], error: 'Error fetching recipes' });
  }
});

app.post('/discover', async (req, res) => {
  req.session.query = req.body.query;
  console.log(req.session.query);
  res.redirect('/discover');
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

async function getApiRecipes(query, req) {
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
    var favoriteState = 0;
    var likeState;
    var likes;
    // Insert or update the recipes in your database
    await Promise.all(apiRecipes.map(async (recipe) => {
      try {
        // Now include the image URL in your insert/update query
        
        const queryFav = await db.query('select count(recipe_id) from favorites where recipe_id=$1 and username=$2', [recipe.id, req.session.user.username]);
        try{
          const queryGetLike = await db.query('select likeState from likes where recipe_id=$1 and username=$2', [recipe.id, req.session.user.username]);
     
          likeState = queryGetLike[0].likestate;
        }
        catch(error)
        {
          likeState = 0;
        }

        try{
          const queryGetLikes = await db.query('select likes from recipes where recipe_id=$1', [recipe.id]);
     
          likes = queryGetLikes[0].likes;
        }
        catch(error)
        {
          likes = 0;
        }

        await db.none('INSERT INTO recipes (recipe_id, title, image, likes) VALUES ($1, $2, $3, $4) ON CONFLICT (recipe_id) DO UPDATE SET title = $2, image = $3', [recipe.id, recipe.title, recipe.image, likes]);
        const getFavState = queryFav[0].count;
        favoriteState = getFavState;
        const insertLikeState = await db.query('INSERT INTO likes (username, likeState, recipe_id) VALUES ($1, $2, $3) RETURNING *', [req.session.user.username, likeState, recipe.id]);
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

app.get('/myRecipe', async (req, res) => {
  var allRecipes = await db.any("SELECT * FROM recipes where username = $1 ORDER BY title ASC", [req.session.user.username]);
  res.render('pages/myRecipe', {recipes: allRecipes});
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
  const likes = 0; // Default number of likes
  const getCustomCount = await db.query('select count(*) from recipes where customRecipe=1');
  console.log(getCustomCount);
  const newId = - (parseInt(getCustomCount[0].count) + 1);
  try {
      const insertQuery = `
          INSERT INTO recipes (recipe_id, title, ingredients, instructions, image, likes, customRecipe, username)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING recipe_id;`;

      const result = await db.one(insertQuery, [newId, name, ingredients, instructions, image, likes, 1, req.session.user.username]);
      res.redirect(`/discover`);
  } catch (error) {
      console.error('Error adding recipe:', error);
      res.render('pages/addRecipe', { message: 'Failed to add recipe. Please try again.' });
  }
});


// Sample route to retrieve and display recipe details

/*app.get('/recipe/:id', async (req, res) => {
  const recipeId = req.params.id;
  var response;
  var recipeInfo;
  try {
    response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
      params: {
        includeNutrition: false, // Adjust as needed
        apiKey: process.env.API_KEY,
      },
    });
    recipeInfo = response.data;
  }
  catch (error) {
    //console.error(error);
    //res.render('pages/recipe', { recipes: [], error: 'API call failed' });
    response = await db.query('select * from recipes where recipeId=$1',[recipeId]);
    var responseData={
      "title" : response.title,
      "image" : response.image
    }
    recipeInfo = response.data;
  }

  //Adding some reviews to the recipes
    const reviews = [
      // Reviews data for the corresponding recipeId
      { review_text: 'Delicious dish! Loved the flavors.', username: 'alice', recipe_id: recipeId },
      { review_text: 'The chicken alfredo was creamy and tasty.', username: 'bob', recipe_id: recipeId },
      { review_text: 'The chicken alfredo was creamy and tasty.', username: 'bob', recipe_id: recipeId },
      { review_text: 'Fantastic recipe! Easy to follow.', username: 'charlie', recipe_id: recipeId },
      { review_text: 'I added extra spices, and it turned out amazing!', username: 'diana', recipe_id: recipeId },
      { review_text: 'Not a fan of this one. Too bland for my taste.', username: 'eve', recipe_id: recipeId }
    ];
    
    const existingReviews = await db.any('SELECT * FROM reviews WHERE recipe_id = $1', [recipeId]);

    if (existingReviews.length === 0) {
      // Insert reviews into the reviews table
      for (const review of reviews) {
        await db.query('INSERT INTO reviews (review_text, username, recipe_id) VALUES ($1, $2, $3)', [review.review_text, review.username, review.recipe_id]);
      }
    }
  
  console.log(recipeInfo);
  //const comments = await db.query(`SELECT review_text AND username FROM reviews WHERE recipe_id = ${recipeId}`);
  const comments = await db.any(`SELECT * FROM reviews WHERE recipe_id = ${recipeId}`);
  var likeState;
  try{
    likeState = await db.any(`SELECT likeState FROM likes WHERE recipe_id = $1 and username = $2`, [recipeId, req.session.user.username]);
    console.log(likeState);
  }
  catch (error)
  {
    likeState = null;
  }

  var data;
  if (likeState == null || likeState[0] == null || likeState[0].likestate == null)
  {
    data = {
      "recipeInfo": recipeInfo,
      "comments": comments,
      "likeState" : 0
    }
  }
  else
  {
    data = {
      "recipeInfo": recipeInfo,
      "comments": comments,
      "likeState" : likeState[0].likestate
    }
  }
  

  //console.log(likeState);
  
  //console.log(data);
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
*/


app.get('/recipe/:id', async (req, res) => {
  const recipeId = req.params.id;
  console.log("Requested recipe ID:", recipeId);

  try {
    let recipeInfo = await db.oneOrNone('SELECT * FROM recipes WHERE recipe_id = $1', [recipeId]);
    console.log("Recipe info from DB:", recipeInfo);

    // Check if the essential details are null and fetch from API if they are
    if (!recipeInfo || recipeInfo.ingredients === null || recipeInfo.instructions === null || recipeInfo.image === null) {
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

    var likeState;
    try{
      likeState = await db.any(`SELECT likeState FROM likes WHERE recipe_id = $1 and username = $2`, [recipeId, req.session.user.username]);
      console.log(likeState);
    }
    catch (error)
    {
      likeState = null;
    }

    var data;
    if (likeState == null || likeState[0] == null || likeState[0].likestate == null)
    {
      data = {
        "recipeInfo": recipeInfo,
        "comments": comments,
        "likeState" : 0
      }
    }
    else
    {
      data = {
        "recipeInfo": recipeInfo,
        "comments": comments,
        "likeState" : likeState[0].likestate
      }
    }
    
    var removedHTMLFromSummary = recipeInfo.summary.replace( /(<([^>]+)>)/ig, '');

    res.render('pages/recipe', { data: data , username: req.session.user.username, editedSummary: removedHTMLFromSummary});
  } catch (error) {
    console.error("Error in /recipe/:id route:", error);
    res.render('pages/recipe', { data: { recipeInfo: {}, comments: [] }, error: 'Failed to load recipe details.' });
  }
});

// Comment section
app.post('/recipe/:id/comment', async (req, res) => {
  const recipeId = req.params.id;
  const review  = req.body.review;
  const username = req.session.user.username;
  
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

app.post('/recipe/:id/like', async (req, res) => {
  const recipeId = req.params.id;
  var likes;
  var likeState;
  try{

    try{
      const queryGetLikeState = await db.query('select likeState from likes where recipe_id=$1 and username=$2', [recipeId, req.session.user.username]);
 
      likeState = queryGetLikeState[0].likestate;
    }
    catch(error)
    {
      likeState = 0;
    }

    try{
      const queryGetLikes = await db.query('select likes from recipes where recipe_id=$1', [recipeId]);
 
      likes = queryGetLikes[0].likes;
    }
    catch(error)
    {
      likes = 0;
    }

    console.log(likeState);

    if (likeState != -1)
    {

      likes = likes + 1;
    }
    else
    {
      likes = likes + 2;
    }

    const updateLike = await db.query('UPDATE recipes SET likes = $1 WHERE recipe_id = $2', [likes, recipeId]);


    const updateLikeState = await db.query('UPDATE likes SET likeState = $1 WHERE recipe_id = $2 and username = $3', [1, recipeId, req.session.user.username]);
    
    
    res.redirect(`/recipe/${recipeId}`);
  }
  catch (error){
    console.log("Could not update like state");
    res.redirect(`/recipe/${recipeId}`);
  }
});

app.post('/recipe/:id/dislike', async (req, res) => {
  const recipeId = req.params.id;
  var likes;
  var likeState;
  try{
    try{
      const queryGetLikeState = await db.query('select likeState from likes where recipe_id=$1 and username=$2', [recipeId, req.session.user.username]);
 
      likeState = queryGetLikeState[0].likestate;
    }
    catch(error)
    {
      likeState = 0;
    }

    try{
      const queryGetLikes = await db.query('select likes from recipes where recipe_id=$1', [recipeId]);
 
      likes = queryGetLikes[0].likes;
    }
    catch(error)
    {
      likes = 0;
    }



    if (likeState != 1)
    {

      likes = likes - 1;
    }
    else
    {
      likes = likes - 2;
    }

    const updateLike = await db.query('UPDATE recipes SET likes = $1 WHERE recipe_id = $2', [likes, recipeId]);


    const updateLikeState = await db.query('UPDATE likes SET likeState = $1 WHERE recipe_id = $2 and username=$3', [-1, recipeId, req.session.user.username]);
    res.redirect(`/recipe/${recipeId}`);
  }
  catch (error){
    console.log("Could not update like state");
    res.redirect(`/recipe/${recipeId}`);
  }
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');