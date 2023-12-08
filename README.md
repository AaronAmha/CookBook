# CookBook
Software Development CSCI 3308 Group Project

1. Application Description
The application allows users to share their recipes with others as well as get ideas for recipes from an external API called Spoonacular. Users are able to upload photos of their final dishes and add ingredients/instructions. Users are able to like or dislike the recipes posted on the page, and the recipes can be sorted by most liked.
Additionally, users can favorite recipes, which will cause the recipe to be shown in the Favorites tab.
Finally, users can look at their profile page, which will provide all their information and a profile picture. 

3. Contributers -
   
   Aaron Amha
   
   Michael Dempsey
   
   Alex Foucher
   
   Sarah Sharroufna

5. Technology Stack - HTML, JavaScript, SQL, Docker, Spoonacular, Microsoft Azure

6. Prerequisites to run the application - Docker

7. Instructions on how to run the application locally -
   
   a. git clone https://github.com/AaronAmha/CookBook.git and extract files
   
   b. Run Docker
   
   c. Open a Terminal
   
   d. Navigate to /cookbook/all project code/components/src in the terminal
   
   e. Run docker compose up -d in the terminal
   
   f. Once the container in docker is up, navigate to http://localhost:3000/

8. How to run the tests - There are automated tests that run after running docker compose up -d from above. These tests test the functionality for the login and the discover page. 

9. Link to the deployed application - http://recitation-16-team-4.eastus.cloudapp.azure.com:3000/
