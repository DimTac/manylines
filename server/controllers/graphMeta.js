var struct = require('../../lib/struct.js'),
    utils = require('../../lib/utils.js'),
    models = {
      snapshot: require('../models/snapshot.js'),
      graphMeta: require('../models/graphMeta.js'),
      graph: require('../models/graph.js'),
      space: require('../models/space.js')
    };




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
      console.log('controllers.graphMeta.get: unknown error retrieving the graph meta object.');
      console.log('  -> Message: ' + err.message);
      return res.send(500);
    }

    return res.json(result);
  });
};
