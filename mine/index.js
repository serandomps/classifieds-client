var list = require('../find');

module.exports = function (ctx, container, options, done) {
    options = options || {}
    list(ctx, container, {
        query: {
            query: {
                user: ctx.token && ctx.user.id
            }
        },
        title: 'My Vehicles',
        size: 3
    }, done);
};
