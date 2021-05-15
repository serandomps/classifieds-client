var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var form = require('form');
var locations = require('model-locations');
var contacts = require('model-contacts');
var Contacts = contacts.service;
var Vehicles = require('../service');
var Makes = require('model-vehicle-makes').service;

dust.loadSource(dust.compile(require('./template'), 'model-vehicles-create'));
dust.loadSource(dust.compile(require('./models/clothes.html'), 'classifieds-client-create-clothes'));

var resolution = '288x162';

var vehicleConfigs = {
    type: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the type of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.type', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value
            }, done);
        }
    },
    manufacturedAt: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the year of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.manufacturedAt', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value ? moment(value).year() : ''
            }, done);
        }
    },
    engine: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the engine capacity of your vehicle.');
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid number for the engine capacity of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    driveType: {
        find: function (context, source, done) {
            done(null, $('input:checked', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the drive type of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.driveType', vform.elem);
            serand.blocks('radios', 'create', el, {
                value: value
            }, done);
        }
    },
    make: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the make of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.make', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    var thiz = $(this);
                    updateModels(vform.contexts.model, vform.elem, thiz.val(), null, function (err) {
                        if (err) {
                            console.error(err);
                        }
                    });
                }
            }, done);
        }
    },
    model: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the model of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.model', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value
            }, done);
        }
    },
    edition: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, null, null);
            }
            if (value.length > 50) {
                return done(null, 'Please enter a shorter value for the edition of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    title: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, null, null);
            }
            if (value.length > 100) {
                return done(null, 'Please enter a shorter value for the title of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    condition: {
        find: function (context, source, done) {
            done(null, $('input:checked', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the condition of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.condition', vform.elem);
            serand.blocks('radios', 'create', el, {
                value: value
            }, done);
        }
    },
    transmission: {
        find: function (context, source, done) {
            done(null, $('input:checked', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the transmission of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.transmission', vform.elem);
            serand.blocks('radios', 'create', el, {
                value: value
            }, done);
        }
    },
    fuel: {
        find: function (context, source, done) {
            done(null, $('input:checked', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the fuel of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.fuel', vform.elem);
            serand.blocks('radios', 'create', el, {
                value: value
            }, done);
        }
    },
    color: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the color of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.color', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value
            }, done);
        }
    },
    mileage: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the mileage of your vehicle.');
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid number for the mileage of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    price: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the price of your vehicle.');
            }
            value = Number(value);
            if (!is.number(value)) {
                return done(null, 'Please enter a valid amount for the price of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    currency: {
        find: function (context, source, done) {
            done(null, 'LKR');
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        }
    },
    description: {
        find: function (context, source, done) {
            done(null, $('textarea', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, null, value);
            }
            if (value.length < 5000) {
                return done(null, null, value);
            }
            done(null, 'Please make sure the description does not exceed 5000 characters.')
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.description', vform.elem);
            serand.blocks('textarea', 'create', el, {
                value: value
            }, done);
        },
        ready: function (context, source, done) {
            serand.blocks('textarea', 'ready', source, done);
        }
    },
    images: {
        find: function (context, source, done) {
            serand.blocks('uploads', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value || !value.length) {
                return done(null, 'Please upload images of your vehicle.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.images', vform.elem);
            serand.blocks('uploads', 'create', el, {
                value: value,
                max: 5,
                min: 1
            }, done);
        }
    },
};

var findContact = function (id, contact, done) {
    if (contact) {
        return done(null, contact);
    }
    Contacts.findOne({id: id}, done);
};

var create = function (found, vehicle, location, contact, done) {
    utils.create('vehicles', Vehicles.create, found, vehicle, function (vehicle, action) {
        return true
    }, function (err, data) {
        if (err) {
            return done(err);
        }
        done(null, data);
    });
};

var remove = function (id, done) {
    Vehicles.remove({id: id}, done);
};

var findModels = function (make, done) {
    if (!make) {
        return done(null, []);
    }
    Makes.findModels(make, function (err, models) {
        if (err) {
            return done(err);
        }
        done(null, models);
    });
};

var updateModels = function (ctx, elem, make, model, done) {
    var source = $('.model', elem);
    findModels(make, function (err, models) {
        if (err) {
            return done(err);
        }
        var modelz = _.map(models, function (model) {
            return {label: model.title, value: model.id};
        });
        serand.blocks('select', 'update', source, {
            options: modelz
        }, done);
    });
};

var stepHandler = function (handler, done) {
    handler.find(function (err, o) {
        if (err) {
            return done(err);
        }
        handler.validate(o, function (err, errors, o) {
            if (err) {
                return done(err);
            }
            handler.update(errors, o, function (err) {
                if (err) {
                    return done(err);
                }
                if (errors) {
                    return done(null, errors);
                }
                done(null, null, o);
            });
        });
    });
};

var createHandler = function (handler, done) {
    stepHandler(handler, function (err, errors, o) {
        if (err) {
            return done(err);
        }
        if (errors) {
            return done(null, errors);
        }
        handler.create(o, done);
    })
};

var render = function (ctx, container, found, done) {
    var sandbox = container.sandbox;
    var data = serand.pack(found || {}, container);
    var id = data.id;

    data._.conditions = [
        {label: 'Brand New', value: 'brand-new'},
        {label: 'Used', value: 'used'},
        {label: 'Unregistered', value: 'unregistered'}
    ];
    data._.transmissions = [
        {label: 'Automatic', value: 'automatic'},
        {label: 'Manual', value: 'manual'},
        {label: 'Manumatic', value: 'manumatic'},
        {label: 'Other', value: 'other'}
    ];
    data._.fuels = [
        {label: 'Petrol', value: 'petrol'},
        {label: 'Diesel', value: 'diesel'},
        {label: 'Hybrid', value: 'hybrid'},
        {label: 'Electric', value: 'electric'},
        {label: 'Other', value: 'other'}
    ];
    data._.driveTypes = Vehicles.driveTypes();
    data._.contacts = [
        {label: 'You', value: 'you'},
        {label: 'Other', value: 'other'}
    ];
    data._.color = [
        {label: 'Black', value: 'black'},
        {label: 'Blue', value: 'blue'},
        {label: 'Brown', value: 'brown'},
        {label: 'Green', value: 'green'},
        {label: 'Orange', value: 'orange'},
        {label: 'Red', value: 'red'},
        {label: 'Silver', value: 'silver'},
        {label: 'White', value: 'white'},
        {label: 'Yellow', value: 'yellow'},
        {label: 'Other', value: 'other'}
    ];
    data._.back = '/vehicles' + (id ? '/' + id : '');
    dust.render('model-vehicles-create', data, function (err, out) {
        if (err) {
            return done(err);
        }
        var elem = sandbox.append(out);
        var handlers = {};
        var vehicleForm = form.create(container.id, $('.tab-pane[data-name="vehicle"] .step', elem), vehicleConfigs);
        handlers.vehicle = vehicleForm;
        vehicleForm.render(ctx, data, function (err) {
            if (err) {
                return done(err);
            }
            locations.picker(ctx, {
                id: container.id,
                sandbox: $('.tab-pane[data-name="location"] .step', elem)
            }, {
                expand: true,
                creatable: true,
                required: true,
                label: 'Location',
                user: data.user,
                location: data.location,
                details: 'Specify the location of your vehicle or select an existing location.'
            }, function (err, o) {
                if (err) {
                    return done(err);
                }
                handlers.location = o;

                contacts.picker(ctx, {
                    id: container.id,
                    sandbox: $('.tab-pane[data-name="contact"] .step', elem)
                }, {
                    expand: true,
                    creatable: true,
                    required: true,
                    label: 'Contacts',
                    user: data.user,
                    contact: data.contact,
                    details: 'Specify the contact details for your vehicle or select an existing contact.'
                }, function (err, o) {
                    if (err) {
                        return done(err);
                    }
                    handlers.contact = o;

                    serand.blocks('steps', 'create', elem, {
                        step: function (from, done) {
                            stepHandler(handlers[from], done);
                        },
                        create: function (elem) {
                            utils.loading();
                            var end = function (err) {
                                utils.loaded();
                                if (err) {
                                    console.error(err);
                                }
                            };
                            createHandler(handlers.vehicle, function (err, errors, vehicle) {
                                if (err) {
                                    return end(err);
                                }
                                if (errors) {
                                    return end();
                                }
                                vehicle.id = vehicle.id || id;
                                createHandler(handlers.location, function (err, errors, lid, location) {
                                    if (err) {
                                        return end(err);
                                    }
                                    if (errors) {
                                        return end();
                                    }
                                    vehicle.location = lid;
                                    createHandler(handlers.contact, function (err, errors, cid, contact) {
                                        if (err) {
                                            return end(err);
                                        }
                                        if (errors) {
                                            return end();
                                        }
                                        vehicle.contact = cid;
                                        findContact(cid, contact, function (err, contact) {
                                            if (err) {
                                                return end(err);
                                            }
                                            create(found, vehicle, location, contact, function (err, vehicle) {
                                                if (err) {
                                                    return end(err);
                                                }
                                                if (contact.status === 'published') {
                                                    return serand.redirect('/vehicles/' + vehicle.id);
                                                }
                                                var location = utils.resolve('autos:///vehicles/' + vehicle.id);
                                                var url = utils.query('accounts:///contacts/' + cid + '/verify', {
                                                    location: location
                                                });
                                                serand.redirect(url);
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    }, function (err) {
                        if (err) {
                            return done(err);
                        }
                        $('.delete', elem).click(function (e) {
                            e.stopPropagation();
                            remove(id, function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                                console.log('data deleted successfully');
                            });
                            return false;
                        });
                        done(null, {
                            clean: function () {
                                $('.model-vehicles-create', sandbox).remove();
                            },
                            ready: function () {
                                vehicleForm.ready(ctx, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                });
                            }
                        });
                    });
                });
            });
        });
    });
};

module.exports = function (ctx, container, options, done) {
    options = options || {};
    var id = options.id;
    if (!id) {
        render(ctx, container, null, done);
        return;
    }
    Vehicles.findOne({
        id: id,
        resolution: resolution
    }, function (err, vehicle) {
        if (err) {
            return done(err);
        }
        render(ctx, container, serand.pack(vehicle, container), done);
    });
};
