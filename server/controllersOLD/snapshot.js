var struct = require('../../lib/struct.js'),
    utils = require('../../lib/utils.js'),
    logger = require('../../lib/log.js').api.logger,
    models = require('../models.js');




/**
 * get:
 * ****
 * This route will return an snapshot object.
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

  // snapshots are all public, no need to check authorization (session):

  models.snapshot.get(params.id, function(err, result) {
    if (err) {
      logger.error(
        'controllers.snapshot.get: unknown error retrieving the snapshot object.',
        {errorMsg: err.message}
      );
      return res.send(500);
    }

    return res.json(result);
  });
};
