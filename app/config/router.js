var express = require('express');
var _ = require('lodash');
var fs = require('fs');

var router = express.Router();

var mapControllersToRouter = function (router, middlewaresCtrl, controllers) {
    if(typeof controllers == "function"){
        controllers = controllers(router, middlewaresCtrl);
    }
    _.forEach(controllers, function (controller) {
        var check_role_callbacks = [];
        if (controller.role) {
            check_role_callbacks = _.concat(middlewaresCtrl.get("need-login"), middlewaresCtrl.get("check-role")(controller.role));
        }
        var list_callbacks = _.map(controller.middlewares, function (args, middleware) {
            return args.length > 0 ? middlewaresCtrl.get(middleware).apply(null, args) : middlewaresCtrl.get(middleware);
        });
        list_callbacks = _.concat(check_role_callbacks, list_callbacks, controller.handler);
        router[controller.method](controller.path, list_callbacks);
    });
};

module.exports = function (app) {
    var listFiles = fs.readdirSync("./app/controllers");
    _.forEach(listFiles, function (File) {
        mapControllersToRouter(router, app.middlewares, require("../controllers/" + File));
    });

    app.use("/api", router);
};