var express = require('express');
var router = express.Router();

router.get('/packages', function(req, res, next) {
    res.header("Content-Type", "application/json");

    res.send({foo: "blatz"});
});

router.get('/package/:id', function(req, res, next) {

});

router.post('/package/:id', function(req, res, next) {

});

module.exports = router;