var list = require('../find');

module.exports = function (ctx, container, options, done) {
    options = options || {};
    var query = options.query || {};
    query.count = options.count || 5;
    list(ctx, container, {
        title: 'Recently Added',
        query: query,
        external: options.external,
        secondary: true,
        size: 12
    }, done);
};
