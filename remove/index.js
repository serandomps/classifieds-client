var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var Vehicle = require('../service');

dust.loadSource(dust.compile(require('./template'), 'model-vehicles-remove'));

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    Vehicle.findOne({id: options.id}, function (err, vehicle) {
        if (err) return done(err);
        dust.render('model-vehicles-remove', serand.pack(vehicle, container), function (err, out) {
            if (err) {
                return done(err);
            }
            var el = sandbox.append(out);
            $('.remove', el).on('click', function () {
                Vehicle.remove(vehicle, function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    serand.redirect('/vehicles');
                });
            });
            done(null, {
                clean: function () {
                    $('.model-vehicles-remove', sandbox).remove();
                },
                ready: function () {
                    var i;
                    var o = [];
                    var images = vehicle._.images;
                    var length = images.length;
                    var image;
                    for (i = 0; i < length; i++) {
                        image = images[i];
                        o.push({
                            href: image.x800,
                            thumbnail: image.x160
                        });
                    }
                    blueimp.Gallery(o, {
                        container: $('.blueimp-gallery-carousel', sandbox),
                        carousel: true,
                        thumbnailIndicators: true,
                        stretchImages: true
                    });
                }
            });
        });
    });
};
