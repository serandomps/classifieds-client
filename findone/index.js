var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var watcher = require('watcher');
var Vehicle = require('../service');
var user = require('user');

var locations = require('model-locations');
var Locations = locations.service;

var contacts = require('model-contacts');
var Contacts = contacts.service;

var recent = require('../recent');

var redirect = serand.redirect;

var token;

dust.loadSource(dust.compile(require('./template'), 'model-vehicles-findone'));
dust.loadSource(dust.compile(require('./actions'), 'model-vehicles-findone-actions'));
dust.loadSource(dust.compile(require('./status'), 'model-vehicles-findone-status'));
dust.loadSource(dust.compile(require('./details'), 'model-vehicles-findone-details'));

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    Vehicle.findOne({id: options.id}, function (err, vehicle) {
        if (err) {
            return done(err);
        }
        async.parallel({
            location: function (found) {
                Locations.findOne({id: vehicle.location}, function (ignored, location) {
                    if (location) {
                        location.country = Locations.findCountry(location.country);
                    }
                    found(null, location);
                });
            },
            contact: function (found) {
                Contacts.findOne({id: vehicle.contact}, function (ignored, contact) {
                    found(null, contact);
                });
            },
            user: function (found) {
                user.findOne(vehicle.user, found);
            }
        }, function (err, o) {
            if (err) {
                return done(err);
            }
            vehicle._.privileged = options.privileged;
            vehicle._.user = o.user;
            vehicle._.contact = o.contact;
            vehicle._.location = o.location;
            if (!vehicle._.location) {
                vehicle._.location = Locations.locateByTags(vehicle.tags);
            }
            if (token && token.user.id === vehicle.user) {
                vehicle._.edit = true;
                vehicle._.bumpable = utils.bumpable(vehicle);
            }
            vehicle._.condition = vehicle.condition.replace(/-/ig, ' ');
            vehicle._.bumped = (vehicle.createdAt !== vehicle.updatedAt);
            vehicle._.offer = utils.capitalize(vehicle.type) + ' for ' + (vehicle.offer === 'sell' ? 'Sale' : 'Rent');
            utils.workflow('model', function (err, workflow) {
                if (err) {
                    return done(err);
                }
                var transitions = workflow.transitions[vehicle.status];
                var status = _.filter(Object.keys(transitions), function (action) {
                    return utils.permitted(ctx.user, vehicle, action);
                });
                vehicle._.status = status.length ? status : null;
                vehicle._.editing = (vehicle.status === 'editing');
                dust.render('model-vehicles-findone', serand.pack(vehicle, container), function (err, out) {
                    if (err) {
                        return done(err);
                    }
                    var elem = sandbox.append(out);
                    locations.findone(ctx, {
                        id: container.id,
                        sandbox: $('.location', elem),
                        parent: elem
                    }, {
                        required: true,
                        label: 'Location of the vehicle',
                        location: vehicle._.location
                    }, function (ignored, o) {
                        recent(ctx, {
                            id: container.id,
                            sandbox: $('.recent', elem)
                        }, {}, function (err, o) {
                            if (err) {
                                return done(err);
                            }
                            elem.on('click', '.status-buttons .dropdown-item', function () {
                                utils.loading();
                                var action = $(this).data('action');
                                if (action === 'edit') {
                                    redirect('/vehicles/' + vehicle.id + '/edit');
                                    return false;
                                }
                                utils.transit('vehicles', vehicle.id, action, function (err) {
                                    utils.loaded();
                                    if (err) {
                                        return console.error(err);
                                    }
                                    redirect('/vehicles/' + vehicle.id);
                                });
                                return false;
                            });
                            elem.on('click', '.bumpup', function () {
                                utils.loading();
                                utils.bumpup('vehicles', vehicle.id, function (err) {
                                    utils.loaded();
                                    if (err) {
                                        return console.error(err);
                                    }
                                    redirect('/vehicles/' + vehicle.id);
                                });
                                return false;
                            });
                            done(null, {
                                clean: function () {
                                    $('.model-vehicles-findone', sandbox).remove();
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
                });
            });
        });
    });
};

watcher.on('user', 'ready', function (tk) {
    token = tk;
});

watcher.on('user', 'logged in', function (tk) {
    token = tk;
});

watcher.on('user', 'logged out', function (tk) {
    token = null;
});
