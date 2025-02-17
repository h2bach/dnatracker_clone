var _ = require('lodash');

//TODO: require middleware, needupdate
var middlewareCtrl = {
    middlewares: {},
    set: function (name, func) {
        this.middlewares[name] = func;
    },
    get: function (name) {
        return this.middlewares[name];
    }
};

module.exports = function (app) {
    app.middlewares = middlewareCtrl;
};