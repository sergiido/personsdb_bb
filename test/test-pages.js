var expect  = require('chai').expect;
var request = require('request');

describe('Pages url tests', function() {
    it('Register page status', function(done) {
        request('http://0.0.0.0:8888/register' , function(error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });
    it('Login page status', function(done) {
        request('http://0.0.0.0:8888/login' , function(error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });
});

describe('Add a new test', function() {
    it("Add new user", function(done) {

request({
  url: 'http://0.0.0.0:8888/register',
  method: 'POST',
  json: {name: 'Test'}
}, function(error, res, body){
  console.log(res);
      expect(res.name).to.equal("Mocha");               
    done();
}); /*.end(function (err, res) {
    expect(res.name).to.equal("Mocha");               
    done();
});*/

    });
});


