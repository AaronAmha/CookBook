// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });

  // ===========================================================================
  // TO-DO: Part A Login unit test case

/*it('positive : /login', done => {
  chai
    .request(server)
    .post('/login')
    .send({username: 'andrew', password: 'password'})
    .redirects(0)
    .end((err, res) => {
      res.should.redirectTo('/discover');
      done();
    });
});

it('Negative : /login. Checking invalid name', done => {
  chai
    .request(server)
    .post('/login')
    .send({username: 'not username', password: 'password'})
    .redirects(0)
    .end((err, res) => {
      res.should.redirectTo('/register');
      done();
    });
});


 // Discover Page test cases
 describe('Discover API Tests', () => {
  // Positive Test Case
  it('Positive: /discover with valid query', done => {
    chai
      .request(server)
      .get('/discover')
      .query({ query: 'chicken' }) 
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include("View Recipe");
        done();
      });
  });

     // Negative Test Case
     it('Negative: /discover with invalid query', done => {
      chai
        .request(server)
        .get('/discover')
        .query({ query: 'invalidqueryterm12345' }) 
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.not.include("View Recipe");
          done();
        });
    });
});*/
});

