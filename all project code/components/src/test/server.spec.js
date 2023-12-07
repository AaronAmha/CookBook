// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

var superagent = require('superagent');
var user = superagent.agent();
//var agent = request.agent('http://localhost:3000');

describe('Server!', () => {

  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    user
      .get('http://localhost:3000/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

describe('Test Login', () => {

  // ===========================================================================
  // TO-DO: Part A Login unit test case

  it('positive : /login', done => {

    user
      .post('http://localhost:3000/login')
      .send({username: 'andrew', password: 'password'})
      .redirects(0)
      .end((err, res) => {
        res.should.redirectTo('/discover');
        done();
      });
  });

  it('Negative : /login. Checking invalid name', done => {
    user
      .post('http://localhost:3000/login')
      .send({username: 'not username', password: 'password'})
      .redirects(0)
      .end((err, res) => {
        res.should.redirectTo('/register');
        done();
      });
  });
});


// Discover Page test cases
describe('Discover API Tests', () => {
  
  // Positive Test Case
  it('Login', done => {
    user
      .post('http://localhost:3000/login')
      .send({username: 'andrew', password: 'password'})
      .redirects(0)
      .end((err, res) => {
        res.should.redirectTo('/discover');
        done();
      });
  });

  it('Positive: /discover with valid query', done => {
    user
      .post('http://localhost:3000/discover')
      .send({ query: 'chicken' }) 
      .end(function(err, res){
        //console.log(res.text);
        expect(res.text).to.include("View Recipe");
        done();
      });
  });

    // Negative Test Case
  it('Negative: /discover with invalid query', done => {
    user
      .post('http://localhost:3000/discover')
      .send({ query: 'invalidqueryterm12345' }) 
      .end((err, res) => {
        //console.log(rest\);
        expect(res.text).to.not.include("View Recipe");
        done();
      });
  });
});

describe('Viewing Recipes', () => {
  it('Positive: /recipe with valid recipe ID', done => {
    user
      .get('http://localhost:3000/recipe/782585?')
      .end(function(err, res){
        //console.log(res.text);
        expect(res).to.have.status(200);
        expect(res.text).to.not.include("No ingredients information available.");
        done();
      });
  });

    // Negative Test Case
  it('Negative: /discover with invalid query', done => {
    user
      .get('http://localhost:3000/recipe/undefined?')
      .end((err, res) => {
        //console.log(rest\);
        expect(res).to.have.status(200);
        expect(res.text).to.include("No ingredients information available.");
        done();
      });
  });
});





