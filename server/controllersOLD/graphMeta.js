var struct = require('../../lib/struct.js'),
    utils = require('../../lib/utils.js'),
    logger = require('../../lib/log.js').api.logger,
    models = require('../models.js');




/**
 * get:
 * ****
 * This route will return the meta of a graph.
 *
 * Params:
 *   - id: string
 *       The graph ID.
 */
exports.get = function(req, res) {
  var params = {
    id: req.params.id
  };

  // Check params:
  if (!struct.check(
    {
      id: 'string'
    },
    params
  ))
    return res.send(400);

  // Check authorizations:
  if (!(req.session.graphMetas || {})[params.id])
    return res.send(401);

  models.graphMeta.get(params.id, function(err, result) {
    if (err) {
      logger.error(
        'controllers.graphMeta.get: unknown error retrieving the graph meta object.',
        {errorMsg: err.message}
      );
      return res.send(500);
    }

    return res.json(result);
  });
};
