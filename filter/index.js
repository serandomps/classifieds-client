var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var form = require('form');
var user = require('user');
var Classifieds = require('../service');
var Makes = require('model-vehicle-makes').service;
var Locations = require('model-locations').service;

var allProvinces = Locations.allProvinces();

dust.loadSource(dust.compile(require('./template'), 'classifieds-client-filter'));

var findQuery = function (vform, done) {
    vform.find(function (err, data) {
        if (err) {
            return done(err);
        }
        vform.validate(data, function (err, errors, data) {
            if (err) {
                return done(err);
            }
            if (errors) {
                return vform.update(errors, data, done);
            }
            to(data, function (err, data) {
                if (err) {
                    return done(err);
                }
                done(null, data);
            });
        });
    });
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

var findDistricts = function (province, done) {
    if (!province) {
        return done(null, Locations.allDistricts());
    }
    return done(null, Locations.districtsByProvince(province));
};

var findCities = function (province, district, done) {
    if (district) {
        return done(null, Locations.citiesByDistrict(district));
    }
    if (province) {
        return done(null, Locations.citiesByProvince(province));
    }
    done(null, Locations.allCities());
};

var to = function (o, done) {
    var query = {};
    if (o.user) {
        query.user = o.user;
    }
    if (o.type) {
        query.type = o.type;
    }
    if (o.make) {
        query.make = o.make;
    }
    if (o.model) {
        query.model = o.model;
    }
    if (o.color) {
        query.color = o.color;
    }
    if (o.condition && o.condition.length) {
        query.condition = {
            $in: o.condition
        };
    }
    if (o.transmission && o.transmission.length) {
        query.transmission = {
            $in: o.transmission
        };
    }
    if (o.fuel && o.fuel.length) {
        query.fuel = {
            $in: o.fuel
        };
    }
    if (o.mileage) {
        query.mileage = o.mileage;
    }
    if (o['manufacturedAt-gte']) {
        query.manufacturedAt = query.manufacturedAt || (query.manufacturedAt = {});
        query.manufacturedAt.$gte = o['manufacturedAt-gte'];
    }
    if (o['manufacturedAt-lte']) {
        query.manufacturedAt = query.manufacturedAt || (query.manufacturedAt = {});
        query.manufacturedAt.$lte = o['manufacturedAt-lte'];
    }
    if (o['price-gte']) {
        query.price = query.price || (query.price = {});
        query.price.$gte = o['price-gte'];
    }
    if (o['price-lte']) {
        query.price = query.price || (query.price = {});
        query.price.$lte = o['price-lte'];
    }
    if (o['location-province']) {
        query.tags = query.tags || (query.tags = []);
        query.tags.push({name: 'location:locations:province', value: o['location-province']});
    }
    if (o['location-district']) {
        query.tags = query.tags || (query.tags = []);
        query.tags.push({name: 'location:locations:district', value: o['location-district']});
    }
    if (o['location-city']) {
        query.tags = query.tags || (query.tags = []);
        query.tags.push({name: 'location:locations:city', value: o['location-city']});
    }
    if (o['location-postal']) {
        query.tags = query.tags || (query.tags = []);
        query.tags.push({name: 'location:locations:postal', value: o['location-postal']});
    }
    done(null, query);
};

var from = function (query, done) {
    var o = {
        _: query._,
        user: query.user,
        type: query.type || '',
        make: query.make || '',
        model: query.model,
        color: query.color,
        mileage: query.mileage,
        'location-province': query['tags:location:province'],
        'location-district': query['tags:location:district'],
        'location-city': query['tags:location:city'],
        'location-postal': query['tags:location:postal']
    };
    if (query.condition) {
        o.condition = query.condition.$in;
    }
    if (query.transmission) {
        o.transmission = query.transmission.$in;
    }
    if (query.fuel) {
        o.fuel = query.fuel.$in;
    }
    if (query.manufacturedAt) {
        if (query.manufacturedAt.$gte) {
            o['manufacturedAt-gte'] = query.manufacturedAt.$gte;
        }
        if (query.manufacturedAt.$lte) {
            o['manufacturedAt-lte'] = query.manufacturedAt.$lte;
        }
    }
    if (query.price) {
        if (query.price.$gte) {
            o['price-gte'] = query.price.$gte;
        }
        if (query.price.$lte) {
            o['price-lte'] = query.price.$lte;
        }
    }
    var tags = query.tags || [];
    tags.forEach(function (tag) {
        var name = tag.name;
        if (name.indexOf('location:locations') === -1) {
            return;
        }
        o['location-' + name.substring(19)] = tag.value;
    });
    var key;
    var value;
    var oo = {};
    for (key in o) {
        if (!o.hasOwnProperty(key)) {
            continue;
        }
        value = o[key];
        if (!value) {
            continue;
        }
        oo[key] = o[key];
    }
    done(null, oo);
};

var redirect = function (ctx, query) {
    var q = utils.toQuery({
        query: query,
        count: 30
    });
    var path = '/vehicles' + (q ? '?' + q : '');
    serand.redirect(path);
};

var configs = {
    user: {
        find: function (context, source, done) {
            done(null, context.user);
        },
        render: function (ctx, vform, data, value, done) {
            var context = {user: data.user};
            $('.user', vform.elem).on('click', '.exclude', function () {
                delete context.user;
                findQuery(vform, function (err, query) {
                    if (err) {
                        return console.error(err);
                    }
                    redirect(ctx, query);
                });
            });
            done(null, context);
        }
    },
    type: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.type', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    make: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        update: function (context, source, error, value, done) {
            serand.blocks('select', 'update', source, {
                value: value
            }, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.make', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    serand.blocks('select', 'update', $('.model', vform.elem), {
                        value: ''
                    }, function (err) {
                        if (err) {
                            return done(err);
                        }
                        findQuery(vform, function (err, query) {
                            if (err) {
                                return console.error(err);
                            }
                            redirect(ctx, query);
                        });
                    });
                }
            }, done);
        }
    },
    model: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.model', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    color: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.color', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    condition: {
        find: function (context, source, done) {
            serand.blocks('checkboxes', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.condition', vform.elem);
            serand.blocks('checkboxes', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    transmission: {
        find: function (context, source, done) {
            serand.blocks('checkboxes', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.transmission', vform.elem);
            serand.blocks('checkboxes', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    fuel: {
        find: function (context, source, done) {
            serand.blocks('checkboxes', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.fuel', vform.elem);
            serand.blocks('checkboxes', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'price-gte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null)
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.price-gte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'price-lte': {
        find: function (context, source, done) {
            serand.blocks('text', 'find', source, function (err, value) {
                if (err) {
                    return done(err);
                }
                done(null, parseInt(value, 10) || null);
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.price-lte', vform.elem);
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'manufacturedAt-gte': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.manufacturedAt-gte', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'manufacturedAt-lte': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.manufacturedAt-lte', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    findQuery(vform, function (err, query) {
                        if (err) {
                            return console.error(err);
                        }
                        redirect(ctx, query);
                    });
                }
            }, done);
        }
    },
    'location-province': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, function (err, province) {
                if (err) {
                    return done(err);
                }
                done(null, province);
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.location-province', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function (e, clickedIndex, isSelected, previousValue) {
                    if (!isSelected) {
                        return;
                    }
                    serand.blocks('select', 'update', $('.location-district', vform.elem), {
                        value: ''
                    }, function (err) {
                        if (err) {
                            return done(err);
                        }
                        serand.blocks('select', 'update', $('.location-city', vform.elem), {
                            value: ''
                        }, function (err) {
                            if (err) {
                                return done(err);
                            }
                            serand.blocks('select', 'update', $('.location-postal', vform.elem), {
                                value: ''
                            }, function (err) {
                                if (err) {
                                    return done(err);
                                }
                                findQuery(vform, function (err, query) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    redirect(ctx, query);
                                });
                            });
                        });
                    });
                }
            }, done);
        }
    },
    'location-district': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.location-district', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function (e, clickedIndex, isSelected, previousValue) {
                    if (!isSelected) {
                        return;
                    }
                    var source = $('.location-district', vform.elem);
                    serand.blocks('select', 'find', source, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        var province = Locations.provinceByDistrict(value);
                        var provinceSource = $('.location-province', vform.elem);
                        serand.blocks('select', 'update', provinceSource, {
                            value: province
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            serand.blocks('select', 'update', $('.location-city', vform.elem), {
                                value: ''
                            }, function (err) {
                                if (err) {
                                    return done(err);
                                }
                                serand.blocks('select', 'update', $('.location-postal', vform.elem), {
                                    value: ''
                                }, function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    findQuery(vform, function (err, query) {
                                        if (err) {
                                            return console.error(err);
                                        }
                                        redirect(ctx, query);
                                    });
                                });
                            });
                        });
                    });
                }
            }, done);
        }
    },
    'location-city': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.location-city', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function (e, clickedIndex, isSelected, previousValue) {
                    if (!isSelected) {
                        return;
                    }
                    var source = $('.location-city', vform.elem);
                    serand.blocks('select', 'find', source, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        var city = Locations.findCity(value);
                        var provinceSource = $('.location-province', vform.elem);
                        serand.blocks('select', 'update', provinceSource, {
                            value: city.province
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            var districtSource = $('.location-district', vform.elem);
                            serand.blocks('select', 'update', districtSource, {
                                value: city.district
                            }, function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                                var postalSource = $('.location-postal', vform.elem);
                                serand.blocks('select', 'update', postalSource, {
                                    value: city.postal
                                }, function (err) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    findQuery(vform, function (err, query) {
                                        if (err) {
                                            return console.error(err);
                                        }
                                        redirect(ctx, query);
                                    });
                                });
                            });
                        });
                    });
                }
            }, done);
        }
    },
    'location-postal': {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.location-postal', vform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function (e, clickedIndex, isSelected, previousValue) {
                    if (!isSelected) {
                        return;
                    }
                    var source = $('.location-postal', vform.elem);
                    serand.blocks('select', 'find', source, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        var city = Locations.cityByPostal(value);
                        var provinceSource = $('.location-province', vform.elem);
                        serand.blocks('select', 'update', provinceSource, {
                            value: city.province
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            var districtSource = $('.location-district', vform.elem);
                            serand.blocks('select', 'update', districtSource, {
                                value: city.district
                            }, function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                                var citySource = $('.location-city', vform.elem);
                                serand.blocks('select', 'update', citySource, {
                                    value: city.name
                                }, function (err) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                    findQuery(vform, function (err, query) {
                                        if (err) {
                                            return console.error(err);
                                        }
                                        redirect(ctx, query);
                                    });
                                });
                            });
                        });
                    });
                }
            }, done);
        }
    }
};

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    options = options || {};

    from(_.cloneDeep(options.query) || {}, function (err, query) {
        if (err) {
            return done(err);
        }
        query._ = query._ || (query._ = {});

        async.parallel({
            makes: function (found) {
                Makes.find(found);
            },
            user: function (found) {
                if (!query.user) {
                    return found();
                }
                user.findOne(query.user, found);
            }
        }, function (err, o) {
            if (err) {
                return done(err);
            }
            query._.user = o.user;
            var makeData = [{label: 'Any Make', value: ''}];
            makeData = makeData.concat(_.map(o.makes, function (make) {
                return {
                    value: make.id,
                    label: make.title
                };
            }));

            findModels(query.make, function (err, models) {
                if (err) {
                    return done(err);
                }

                var modelData = [{label: 'Any Model', value: ''}];
                modelData = modelData.concat(_.map(models, function (model) {
                    return {
                        value: model.id,
                        label: model.title
                    };
                }));

                var manufacturedAt = [];
                var year = moment().year();
                var start = year - 100;
                while (year > start) {
                    manufacturedAt.push({label: year, value: year});
                    year--;
                }

                query._.container = container.id;
                query._.makes = makeData;
                query._.models = modelData;
                query._.types = [{label: 'Any Type', value: ''}].concat(Classifieds.types());
                query._.manufacturedFrom = [{label: 'From Any Year', value: ''}].concat(manufacturedAt);
                query._.manufacturedTo = [{label: 'To Any Year', value: ''}].concat(manufacturedAt);
                query._.conditions = [
                    {label: 'Brand New', value: 'brand-new'},
                    {label: 'Used', value: 'used'},
                    {label: 'Unregistered', value: 'unregistered'}
                ];
                query._.transmissions = [
                    {label: 'Automatic', value: 'automatic'},
                    {label: 'Manual', value: 'manual'},
                    {label: 'Manumatic', value: 'manumatic'},
                    {label: 'Other', value: 'other'}
                ];
                query._.fuels = [
                    {label: 'None', value: 'none'},
                    {label: 'Petrol', value: 'petrol'},
                    {label: 'Diesel', value: 'diesel'},
                    {label: 'Hybrid', value: 'hybrid'},
                    {label: 'Electric', value: 'electric'},
                    {label: 'Other', value: 'other'}
                ];
                query._.colors = [
                    {label: 'Any Color', value: ''},
                    {label: 'Black', value: 'black'},
                    {label: 'Blue', value: 'blue'},
                    {label: 'Brown', value: 'brown'},
                    {label: 'Green', value: 'green'},
                    {label: 'Grey', value: 'grey'},
                    {label: 'Orange', value: 'orange'},
                    {label: 'Red', value: 'red'},
                    {label: 'Silver', value: 'silver'},
                    {label: 'White', value: 'white'},
                    {label: 'Yellow', value: 'yellow'},
                    {label: 'Other', value: 'other'}
                ];
                var provinces = [{label: 'Any Province', value: ''}];
                query._.provinces = provinces.concat(_.map(allProvinces, function (province) {
                    return {
                        label: province,
                        value: province
                    };
                }));
                findDistricts(query['location-province'], function (err, districts) {
                    if (err) {
                        return done(err);
                    }
                    var districtsData = [{label: 'Any District', value: ''}];
                    query._.districts = districtsData.concat(_.map(districts, function (district) {
                        return {
                            label: district,
                            value: district
                        };
                    }));
                    findCities(query['location-province'], query['location-district'], function (err, cities) {
                        if (err) {
                            return done(err);
                        }
                        var citiesData = [{label: 'Any City', value: ''}];
                        var postalsData = [{label: 'Any Postal Code', value: ''}];
                        query._.cities = citiesData.concat(_.map(cities, function (city) {
                            return {
                                label: city.name,
                                value: city.name
                            };
                        }));
                        query._.postals = postalsData.concat(_.map(cities, function (city) {
                            return {
                                label: city.postal,
                                value: city.postal
                            }
                        }));

                        dust.render('classifieds-client-filter', serand.pack(query, container), function (err, out) {
                            if (err) {
                                return done(err);
                            }

                            var elem = sandbox.append(out);
                            var vform = form.create(container.id, elem, configs);

                            vform.render(ctx, query, function (err) {
                                if (err) {
                                    return done(err);
                                }
                                done(null, function () {
                                    $('.classifieds-client-filter', sandbox).remove();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
