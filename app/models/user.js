const crypto = require('crypto');
var mongoose = require("mongoose");
var shortid = require('shortid');
var _ = require('lodash');

var roles = "curator admin".split(" ");

var UserSchema = new mongoose.Schema({
    email: {type: String, default: '', trim: true},
    username: {type: String, default: '', trim: true},
    hashed_password: {type: String, default: ''},
    salt: {type: String, default: ''},
    role: {type: String, enum: roles, default: roles[0]}
});

UserSchema
    .virtual('password')
    .set(function (password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
        // console.log(this.hashed_password);
    })
    .get(function () {
        return this._password;
    });

UserSchema.methods = {
    checkPassword: function (plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },
    makeSalt: function () {
        return shortid.generate();
    },
    encryptPassword: function (password) {
        if (!password) return '';
        try {
            return crypto
                .createHmac('sha1', this.salt)
                .update(password)
                .digest('hex');
        } catch (err) {
            return '';
        }
    }
};

UserSchema.statics = {
    authenticate: function (options, cb) {
        options.select = options.select || "email username role admin";
        return this.findOne(options.criteria).select(options.select).exec()
            .then(function (user) {
                // console.log(crypto
                //     .createHmac('sha1', this.salt)
                //     .update("biodiversity@2025")
                //     .digest('hex'));
                if (!user) {
                    throw { message: 'Unknown user' };
                } else if (!user.checkPassword(options.password)) {
                    throw { message: 'Invalid password' };
                } else {
                    // In ra hashed_code của chuỗi 'biodiversity@2025' với salt của user
                    const hashedCode = crypto
                        .createHmac('sha1', user.salt)
                        .update('biodiversity@2025')
                        .digest('hex');
                    console.log('Hashed code for biodiversity@2025:', hashedCode);
                    console.log(user.hashed_password);
                }
                return _.pick(user, "username role admin _id".split(" "));
            })
            .then(function (userData) {
                cb(null, userData);
            })
            .catch(function (err) {
                cb(err, null);
            });
    },
    resetPassword: function (user_id, cb) {
        this.findOne({_id: user_id})
            .then(function (user) {
                var newpass = shortid.generate();
                user.password = newpass;
                return user.save();
            })
            .then(function () {
                cb(null, newpass);
            })
            .catch(function (err) {
                cb(err, null);
            });
    }
};

module.exports = mongoose.model("Users", UserSchema);