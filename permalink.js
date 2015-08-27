var permalink = {};

// import config
var config = require('./config');
var mongo = require('mongoskin');

// setup MongoDB
var db = mongo.db(config.mongohost);
db.bind('permalinks');

permalink.listPermalinks = function(done) {
    db.permalinks.find().toArray(function(err, found) {
        if (err) {
            done(null, err);
        } else {
            done(found);
        }
    });
}

permalink.getPermalink = function(pid, deliver) {
    console.log(pid);
    db.permalinks.findById(pid, function(err, found) {
        console.log("found prev permalink?", found, err);
        if (err || !found) {
            deliver(null, err);
        } else {
            console.log("returning", found);
            deliver(found.query);
        }
    });
}

permalink.savePermalink = function(query, deliver) {
    db.permalinks.findOne({query: query}, function(err, found) {
        console.log("found one?", found);
        if (found) {
            deliver(found._id, null);
        } else {
            db.permalinks.insert({query: query}, function(err, result) {
                deliver(result[0]._id, err);
            });
        }
    });
}

module.exports = permalink;
