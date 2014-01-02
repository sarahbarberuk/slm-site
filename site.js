var express = require("express");
var _ = require("underscore");

var config = require("./config.json");

var db = require("./database");
var swig = require('swig');

var site = express();

site.engine('swig.html', swig.renderFile);

site.set('view engine', 'swig.html');

site.use(express.logger());
site.use("/static", express.static(__dirname + "/" + config.static_dir));

site.use(express.cookieParser())
site.use(express.session({secret: config.secret}));
site.use(express.bodyParser());

site.use(function (req, res, next) {
    res.locals.email = req.session.email;
    next();
});

site.use(db(config.db));

site.locals.nav = []

_.each(_.sortBy(config.apps, function (app) { return app.position || 0 }), function (app) {
    var module = require(app.module);
    site.use(app.route, module.app(config, db, site));
    
    // setup nav for navigation menu
    if (!module.routes) {
        site.locals.nav.push({
            route: app.route,
            name: module.title
        });
    }
    else {
        _.each(module.routes, function(route) {
            site.locals.nav.push({
                route: app.route + route.path,
                name: route.name
            });
        });
    }
});

site.listen(config.port);
console.log("Started listening on port " + config.port);
