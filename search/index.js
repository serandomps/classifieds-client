var Classifieds = require('../service');
var find = require('../find');
var user = require('user');
var serand = require('serand');
var utils = require('utils');
var watcher = require('watcher');

var hooks = {
    'query.manufacturedAt.$lte': function (val) {
        return new Date(val).toISOString();
    },
    'query.manufacturedAt.$gte': function (val) {
        return new Date(val).toISOString();
    },
    'query.price.$lte': function (val) {
        return parseInt(val, 10);
    },
    'query.price.$gte': function (val) {
        return parseInt(val, 10);
    },
    'count': function (val) {
        return parseInt(val, 10);
    },
    'direction': function (val) {
        return parseInt(val, 10);
    },
    'sort.updatedAt': function (val) {
        return parseInt(val, 10);
    },
    'sort.id': function (val) {
        return parseInt(val, 10);
    }
};

var prepare = function (o) {
    Object.keys(hooks).forEach(function (path) {
        var val;
        var part;
        var hook = hooks[path];
        var parts = path.split('.');
        var pointer = o;
        while (parts.length) {
            part = parts.shift();
            val = pointer[part];
            if (!val) {
                break;
            }
            if (!parts.length) {
                pointer[part] = hook(val);
                break;
            }
            pointer = val;
        }
    });
    return o;
};

var render = function (ctx, container, paging, query, page, done) {
    Classifieds.find({
        query: prepare(query),
        resolution: '288x162'
    }, function (err, classifieds, links) {
        if (err) {
            return done(err);
        }
        var pageBox = $('<div class="classifieds-client-search-page" data-page="' + page + '"></div>');
        find(ctx, {
            id: container.id,
            sandbox: pageBox
        }, {
            prefix: paging.prefix,
            classifieds: classifieds,
            size: 4
        }, function (err, clean) {
            if (err) {
                return done(err);
            }
            if (paging.active > page) {
                container.sandbox.prepend(pageBox);
            } else {
                container.sandbox.append(pageBox);
            }
            paging.queries[page] = query;
            watcher.emit('footer', 'pages', paging.end, findActivePage(container));
            done(null, clean, links);
        });
    });
};

var findActivePage = function (container) {
    var page = $('.classifieds-client-search-page', container.sandbox).mostVisible().data('page');
    if (!page) {
        return 0;
    }
    return parseInt(page, 10);
};

var findActiveQuery = function (paging) {
    return paging.queries[paging.active];
}

var pushState = function (ctx, container, paging) {
    var q = utils.toData(findActiveQuery(paging)) + '&page=' + paging.active;
    utils.pushState(paging.prefix + q, $(document).find('title').text(), {
        path: paging.path + q,
        backed: true
    });
};

module.exports = function (ctx, container, options, done) {
    var loadable = options.loadable;
    var cleaners = [];
    var query = options.query;
    var page = query.page ? parseInt(query.page, 10) : 1;
    var q = query.data ? JSON.parse(query.data) : query;
    var path = '/' + options.category;
    var prefix = utils.resolve('classifieds://' + path);
    var paging = {
        path: path,
        prefix: prefix,
        queries: {},
        start: page,
        end: page,
        active: page
    };
    render(ctx, container, paging, q, page, function (err, clean, links) {
        if (err) {
            return done(err);
        }
        if (!loadable) {
            return done(null, clean);
        }
        cleaners.push(clean);

        paging.next = links.next;
        paging.prev = links.prev;

        var scrolled = function (o) {
            var active = findActivePage(container);
            if (active === paging.active) {
                return;
            }
            paging.active = active;
            pushState(ctx, container, paging);
            watcher.emit('footer', 'pages', paging.end, active);
        };

        var scrolledDown = function () {
            if (paging.pending || !paging.next) {
                return;
            }
            paging.pending = true;
            paging.end++;
            render(ctx, container, paging, paging.next.query, paging.end, function (err, clean, linkz) {
                if (err) {
                    return console.error(err);
                }
                paging.pending = false;
                cleaners.push(clean);
                paging.next = linkz.next;
                paging.prev = linkz.prev ? paging.prev : null;
            });
        };

        var scrollBuffer = function () {
            if (!paging.prev) {
                return;
            }
            setTimeout(function () {
                $('html, body').animate({scrollTop: 100});
            }, 0);
        };

        var scrolledUp = function () {
            if (paging.pending || !paging.prev || paging.start === 1) {
                return;
            }

            paging.pending = true;
            paging.start--;
            render(ctx, container, paging, paging.prev.query, paging.start, function (err, clean, linkz) {
                if (err) {
                    return console.error(err);
                }
                paging.pending = false;
                cleaners.push(clean);
                links = linkz;
                paging.next = links.next ? paging.next : null;
                paging.prev = links.prev;
                scrollBuffer();
            });
        };

        done(null, {
            clean: function () {
                watcher.off('serand', 'scrolled', scrolled);
                watcher.off('serand', 'scrolled down', scrolledDown);
                watcher.off('serand', 'scrolled up', scrolledUp);
                cleaners.forEach(function (clean) {
                    clean();
                });
            },
            ready: function () {
                watcher.on('serand', 'scrolled', scrolled);
                watcher.on('serand', 'scrolled down', scrolledDown);
                watcher.on('serand', 'scrolled up', scrolledUp);
                if (paging.end > 1) {
                    watcher.emit('footer', 'pages', paging.end, paging.active);
                }
                if (ctx.state.backed && !paging.backed) {
                    paging.backed = true;
                    scrollBuffer();
                }
            }
        });
    });
};
