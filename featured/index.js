var list = require('../find');

module.exports = function (ctx, container, options, done) {
    var query = options.query || {
        count: 12
    };
    list(ctx, container, {
        title: 'Featured',
        query: query,
        secondary: true,
        size: options.size || 4
    }, done);
};
