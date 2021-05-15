var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');

var Classifieds = require('../service');

dust.loadSource(dust.compile(require('./template'), 'classified-categories'));

module.exports = function (ctx, container, options, done) {
    console.log(Classifieds.categories())
    var sandbox = container.sandbox;
    dust.render('classified-categories', serand.pack({
        categories: Classifieds.categories(),
        size: 3
    }, container), function (err, out) {
        if (err) {
            return done(err);
        }
        sandbox.append(out);
        done(null, function () {
            $('.classified-categories', sandbox).remove();
        });
    });
};
