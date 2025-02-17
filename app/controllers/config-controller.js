var _ = require("lodash");

module.exports = function (router, middlewares) {
    router.use("/config", middlewares.get("need-login"), middlewares.get("check-role")("admin"));
    return [
        {
            method: "get",
            path: "/config",
            handler: function getAllUser(req, res) {
                res.end();
            }

        },
        {
            method: "post",
            path: "/config",
            handler: function getOneUserById(req, res) {
                res.end();
            }
        }
    ]
};