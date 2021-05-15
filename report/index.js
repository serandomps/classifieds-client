var messages = require('model-messages');

var Vehicles = require('../service');

module.exports = function (ctx, container, options, done) {
    Vehicles.findOne({id: options.about}, function (err, vehicle) {
        if (err) {
            return done(err);
        }
        messages.create(ctx, container, {
            about: vehicle,
            model: 'vehicles'
        }, done);
    });
};
