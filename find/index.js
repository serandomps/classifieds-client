var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var Classifieds = require('../service');

dust.loadSource(dust.compile(require('./template'), 'classifieds-client-find'));

var fetch = function (options, done) {
    var o = _.cloneDeep(options);
    o.prefix = utils.resolve('classifieds:///' + options.model);
    Classifieds.find(o, function (err, classifieds) {
        if (err) {
            return done(err);
        }
        classifieds.forEach(function (classified) {
            if (o.editable) {
                classified._.edit = true;
            }
        });
        o.classifieds = classifieds;
        done(null, o);
    });
};

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    fetch(options, function (err, o) {
        if (err) {
            return done(err);
        }
        dust.render('classifieds-client-find', serand.pack(o, container), function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);
            done(null, function () {
                $('.classifieds-client-find', sandbox).remove();
            });
        });
    });
};
