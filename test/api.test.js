import supertest from "supertest";
import { expect } from "chai";
import { createServer } from "http";
import app from '../src/index.js' // Import your server instance

describe("Oracle API Tests", function () {

    let server;

    before(function (done) {
      server = createServer(app); // Wrap the app in an HTTP server
      server.listen(done); // Start the server
    });
  
    after(function (done) {
      server.close(done); // Stop the server after tests
    });
    
    it("API status should return running status", function (done) {
        supertest(server)
            .get("/api/status")
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property("status", "API is running");
                done();
            });
    });

    it("Should fetch prices for all assets", function (done) {
        supertest(server)
            .get("/api/prices")
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property("prices");
                done();
            });
    });

    it("Should fetch the price for a specific asset", function (done) {
        const asset = "BTC";
        supertest(server)
            .get(`/api/prices/${asset}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property("asset", asset);
                expect(res.body).to.have.property("price");
                done();
            });
    });

    it("Should return error for an unknown asset", function (done) {
        const asset = "UNKNOWN";
        supertest(server)
            .get(`/api/prices/${asset}`)
            .expect(500)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property("error");
                done();
            });
    });
});
