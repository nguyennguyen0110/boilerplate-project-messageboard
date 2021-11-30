'use strict';
const handler = require('./handler.js');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(handler.threads_get)
    .post(handler.threads_post)
    .delete(handler.threads_delete)
    .put(handler.threads_put);
    
  app.route('/api/replies/:board')
    .get(handler.replies_get)
    .post(handler.replies_post)
    .delete(handler.replies_delete)
    .put(handler.replies_put);

};
