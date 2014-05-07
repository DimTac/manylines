var struct = require('../../lib/struct.js'),
    utils = require('../../lib/utils.js'),
    errors = require('../../errors.json'),
    validator = require('validator'),
    models = {
      graphMeta: require('../models/graphMeta.js'),
      graph: require('../models/graph.js'),
      space: require('../models/space.js')
    };




/**
 * login:
 * ******
 * This route will log an user into a space and every graphs and metas attached
 * to it.
 *
 * Params:
 *   - id: string
 *       The space ID.
 *   - password: string
 *       The password of the space.
 */
exports.login = function(req, res) {
  var params = {
    password: req.params.password,
    id: req.params.id
  };

  // Check params:
  if (!struct.check(
    {
      password: 'string',
      id: 'string'
    },
    params
  ))
    return res.send(400);

  models.space.get(params.id, function(err, result) {
    if (err) {
      if (err.code === 13) {
        console.log('controllers.space.login: space "' + params.id + '" not found.');
        console.log('  -> Message: ' + err.message);
      } else {
        console.log('controllers.space.login: unknown error.');
        console.log('  -> Message: ' + err.message);
      }

      return res.send(401);
    }

    if (result.password !== utils.encrypt(params.password))
      return res.send(401);
    else {
      var date = Date.now();

      // Add space, graphs metas and graphs to the session:
      req.session.spaces = req.session.spaces || {};
      req.session.graphs = req.session.graphs || {};
      req.session.graphMetas = req.session.graphMetas || {};

      req.session.spaces[params.id] = date;
      result.graphs.forEach(function(obj) {
        req.session.graphs[obj.id] = date;
        req.session.graphMetas[obj.metaId] = date;
      });

      // Send response:
      return res.json({
        id: params.id,
        email: result.email,
        version: result.graphs.length
      });
    }
  });
};




/**
 * logout:
 * *******
 * This route will log an user out a space and every graphs and metas attached
 * to it. If no ID is specified, then the user will be logged out of every
 * spaces, graphs and metas he wes logged into.
 *
 * Params:
 *   - id: string
 *       The space ID.
 */
exports.logout = function(req, res) {
  var params = {
    id: req.params.id
  };

  // Check params:
  if (!struct.check(
    {
      id: '?string'
    },
    params
  ))
    return res.send(400);

  if (typeof params.id === 'string')
    models.space.get(params.id, function(err, result) {
      if (err) {
        if (err.code === 13) {
          console.log('controllers.space.logout: space "' + params.id + '" not found.');
          console.log('  -> Message: ' + err.message);
        } else {
          console.log('controllers.space.logout: unknown error.');
          console.log('  -> Message: ' + err.message);
        }

        return res.json({
          ok: true
        });
      }

      // Remove space, graphs metas and graphs from the session:
      delete (req.session.spaces || {})[params.id];
      result.graphs.forEach(function(obj) {
        delete (req.session.graphs || {})[obj.id];
        delete (req.session.graphMetas || {})[obj.metaId];
      });

      // Send response:
      return res.json({
        ok: true
      });
    });
  else {
    delete req.session.spaces;
    delete req.session.graphs;
    delete req.session.graphMetas;

    return res.json({
      ok: true
    });
  }
};




/**
 * create:
 * *******
 * This route will create a new space, with an empty graph and an empty meta
 * object attached to it.
 *
 * Params:
 *   - email: string
 *       The space email.
 *   - password: string
 *       The space password.
 */
exports.create = function(req, res) {
  var params = {
    password: req.body.password,
    email: req.body.email
  };

  // Check params:
  if (!struct.check(
    {
      password: 'string',
      email: 'string'
    },
    params
  ))
    return res.send(400);

  if (!validator.isEmail(params.email))
    return res.send(400, errors.INPUT_INVALID_EMAIL);

  if (!validator.isLength(params.password, 8))
    return res.send(400, errors.INPUT_INVALID_PASSWORD);

  models.graph.set({}, function(err, graphResult) {
    if (err) {
      console.log('controllers.space.create: unknown error creating the graph object.');
      console.log('  -> Message: ' + err.message);
      return res.send(500);
    }

    models.graphMeta.set({}, function(err, graphMetaResult) {
      if (err) {
        console.log('controllers.space.create: unknown error creating the graph meta object.');
        console.log('  -> Message: ' + err.message);
        return res.send(500);
      }

      models.space.set({
        password: utils.encrypt(params.password),
        email: params.email,
        graphs: [
          {
            id: graphResult.id,
            metaId: graphMetaResult.id
          }
        ]
      }, function(err, spaceResult) {
        if (err) {
          console.log('controllers.space.create: unknown error creating the space object.');
          console.log('  -> Message: ' + err.message);
          return res.send(500);
        }

        var date = Date.now();

        // Add space, graphs metas and graphs to the session:
        req.session.spaces = req.session.spaces || {};
        req.session.graphs = req.session.graphs || {};
        req.session.graphMetas = req.session.graphMetas || {};

        req.session.spaces[spaceResult.id] = date;
        req.session.graphs[spaceResult.value.graphs[0].id] = date;
        req.session.graphMetas[spaceResult.value.graphs[0].metaId] = date;

        return res.json({
          id: spaceResult.id,
          email: spaceResult.value.email,
          version: spaceResult.value.graphs.length
        });
      });
    });
  });
};




/**
 * update:
 * *******
 * This route will update the meta of a space.
 *
 * Params:
 *   - id: string
 *       The space ID.
 *   - email: ?string
 *       The space email.
 *   - password: ?string
 *       The space password.
 */
exports.update = function(req, res) {
  var params = {
    password: req.body.password,
    email: req.body.email,
    id: req.params.id
  };

  // Check params:
  if (!struct.check(
    {
      password: '?string',
      email: '?string',
      id: 'string'
    },
    params
  ))
    return res.send(400);

  if (params.email && !validator.isEmail(params.email))
    return res.send(400, errors.INPUT_INVALID_EMAIL);

  if (params.password && !validator.isLength(params.password, 8))
    return res.send(400, errors.INPUT_INVALID_PASSWORD);

  // Check authorizations:
  if (!(req.session.spaces || {})[params.id])
    return res.send(401);

  models.space.get(params.id, function(err, result) {
    if (err) {
      console.log('controllers.space.update: unknown error retrieving the graph object.');
      console.log('  -> Message: ' + err.message);
      return res.send(500);
    }

    var data = {
      graphs: result.graphs
    };

    if (params.email)
      data.email = params.email;
    else
      data.email = result.email;

    if (params.password)
      data.password = utils.encrypt(params.password);
    else
      data.password = result.password;

    models.space.set(data, params.id, function(err, spaceResult) {
      if (err) {
        console.log('controllers.space.update: unknown error updating the space object.');
        console.log('  -> Message: ' + err.message);
        return res.send(500);
      }

      return res.json({
        id: spaceResult.id,
        email: spaceResult.value.email,
        version: spaceResult.value.graphs.length
      });
    });
  });
};




/**
 * get:
 * ****
 * This route will return the meta of a space.
 *
 * Params:
 *   - id: string
 *       The space ID.
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
  if (!(req.session.spaces || {})[params.id])
    return res.send(401);

  models.space.get(params.id, function(err, result) {
    if (err) {
      console.log('controllers.space.get: unknown error retrieving the graph object.');
      console.log('  -> Message: ' + err.message);
      return res.send(500);
    }

    return res.json({
      id: req.params.id,
      email: result.email,
      version: result.graphs.length
    });
  });
};




/**
 * delete:
 * *******
 * This route will delete a space, and every graphs and metas attached to it.
 *
 * Params:
 *   - id: string
 *       The space ID.
 */
exports.delete = function(req, res) {
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
  if (!(req.session.spaces || {})[params.id])
    return res.send(401);

  var calls = 0,
      handlerFactory = function(service, id) {
        return function(err, result) {
          if (err) {
            if (err.code === 13) {
              console.log('controllers.space.delete: ' + service + ' "' + id + '" not found.');
              console.log('  -> Message: ' + err.message);
              return res.send(401);
            } else {
              console.log('controllers.space.delete: unknown error deleting the ' + service + ' object "' + id + '".');
              console.log('  -> Message: ' + err.message);
            }

            return res.send(500);
          }
          if (err) {
            console.log('controllers.space.delete: unknown error deleting the ' + service + ' object "' + id + '".');
            console.log('  -> Message: ' + err.message);
            return res.send(500);
          }

          if (--calls === 0)
            models.space.remove(params.id, function(err, spaceResult) {
              if (err) {
                console.log('controllers.space.delete: unknown error deleting the space object "' + params.id + '".');
                console.log('  -> Message: ' + err.message);
                return res.send(500);
              }

              return res.json({
                id: params.id
              });
            });
        }
      };

  // Remove space from the session:
  delete req.session.spaces[params.id];

  models.space.get(params.id, function(err, data) {
    if (err) {
      if (err.code === 13) {
        console.log('controllers.space.delete: space "' + params.id + '" not found.');
        console.log('  -> Message: ' + err.message);
        return res.send(401);
      } else {
        console.log('controllers.space.delete: unknown error getting the space object "' + params.id + '".');
        console.log('  -> Message: ' + err.message);
      }

      return res.send(500);
    }

    if (data.graphs.length)
      data.graphs.map(function(obj) {
        calls += 2;
        models.graph.remove(obj.id, handlerFactory('graph', obj.id));
        models.graphMeta.remove(obj.metaId, handlerFactory('graph meta',obj.metaId));

        delete req.session.graphs[obj.id];
        delete req.session.graphMetas[obj.metaId];
      });
    else
      // Nothing is wrong
      handlerFactory()();
  });
};




/**
 * readGraph:
 * **********
 * This route will return the n-th graph and its meta object of a space, n
 * being its version in the space.
 *
 * Params:
 *   - id: string
 *       The space ID.
 *   - version: integer
 *       The version of the graph in the space.
 */
exports.readGraph = function(req, res) {
  var params = {
    id: req.params.id,
    version: +req.params.version
  };

  // Check params:
  if (!struct.check(
    {
      id: 'string',
      version: 'integer'
    },
    params
  ))
    return res.send(400);

  // Check authorizations:
  if (!(req.session.spaces || {})[params.id])
    return res.send(401);

  models.space.get(params.id, function(err, data) {
    if (err) {
      if (err.code === 13) {
        console.log('controllers.space.readGraph: space "' + params.id + '" not found.');
        console.log('  -> Message: ' + err.message);
        return res.send(401);
      } else {
        console.log('controllers.space.readGraph: unknown error.');
        console.log('  -> Message: ' + err.message);
      }
      return res.send(500);
    }

    if (!data.graphs.length) {
      console.log('controllers.space.readGraph: space "' + params.id + '" has no graph.');
      console.log('  -> Message: ' + err.message);
      return res.send(500);
    }

    if ((params.version > data.graphs.length - 1) || (params.version < 0)) {
      console.log('controllers.space.readGraph: wrong version number: ' + params.version + ' (last version: ' + (data.graphs.length + 1) + ').');
      console.log('  -> Message: ' + err.message);
      return res.send(400);
    }

    var calls = 2,
        toSend = {},
        last = data.graphs[params.version];

    models.graph.get(last.id, function(err, data) {
      if (err) {
        if (err.code === 13) {
          console.log('controllers.space.readGraph: graph "' + last.id + '" not found.');
          console.log('  -> Message: ' + err.message);
          return res.send(401);
        } else {
          console.log('controllers.space.readGraph: unknown error getting graph "' + last.id + '".');
          console.log('  -> Message: ' + err.message);
        }

        return res.send(500);
      }

      toSend.graph = data;

      if (--calls === 0)
        return res.json(toSend);
    });

    models.graphMeta.get(last.metaId, function(err, data) {
      if (err) {
        if (err.code === 13) {
          console.log('controllers.space.readGraph: graph meta "' + last.metaId + '" not found.');
          console.log('  -> Message: ' + err.message);
          return res.send(401);
        } else {
          console.log('controllers.space.readGraph: unknown error getting graph meta "' + last.metaId + '".');
          console.log('  -> Message: ' + err.message);
        }

        return res.send(500);
      }

      toSend.meta = data;

      if (--calls === 0)
        return res.json(toSend);
    });
  });
};




/**
 * updateGraph:
 * ************
 * This route will update the n-th graph or/and its meta object of a space, n
 * being its version in the space.
 *
 * Params:
 *   - id: string
 *       The space ID.
 *   - meta: ?object
 *       Eventually the new meta object.
 *   - graph: ?object
 *       Eventually the new graph object.
 *   - version: integer
 *       The version of the graph in the space.
 */
exports.updateGraph = function(req, res) {
  var params = {
    id: req.params.id,
    meta: req.body.meta,
    graph: req.body.graph,
    version: +req.params.version
  };

  // Check params:
  if (!struct.check(
    {
      id: 'string',
      meta: '?object',
      graph: '?object',
      version: 'integer'
    },
    params
  ))
    return res.send(400);

  // Check authorizations:
  if (!(req.session.spaces || {})[params.id])
    return res.send(401);

  models.space.get(params.id, function(err, data) {
    if (err) {
      if (err.code === 13) {
        console.log('controllers.space.updateGraph: space "' + params.id + '" not found.');
        console.log('  -> Message: ' + err.message);
        return res.send(401);
      } else {
        console.log('controllers.space.updateGraph: unknown error.');
        console.log('  -> Message: ' + err.message);
      }
      return res.send(500);
    }

    if (!data.graphs.length) {
      console.log('controllers.space.updateGraph: space "' + params.id + '" has no graph stored.');
      console.log('  -> Message: ' + err.message);
      return res.send(500);
    }

    if ((params.version > data.graphs.length - 1) || (params.version < 0)) {
      console.log('controllers.space.updateGraph: wrong version number: ' + params.version + ' (last version: ' + (data.graphs.length + 1) + ').');
      console.log('  -> Message: ' + err.message);
      return res.send(400);
    }

    var calls = 0,
        toSend = {},
        graph = data.graphs[params.version];

    if (params.graph) {
      calls++;

      models.graph.set(
        params.graph,
        graph.id,
        function(err, data) {
          if (err) {
            console.log('controllers.space.updateGraph: unknown error creating the graph object.');
            console.log('  -> Message: ' + err.message);
            return res.send(500);
          }

          toSend.graph = data.value;

          if (--calls === 0)
            return res.json(toSend);
        }
      );
    }

    if (params.meta) {
      calls++;

      models.graphMeta.set(
        params.meta,
        graph.metaId,
        function(err, data) {
          if (err) {
            console.log('controllers.space.updateGraph: unknown error creating the graph meta object.');
            console.log('  -> Message: ' + err.message);
            return res.send(500);
          }

          toSend.meta = data.value;

          if (--calls === 0)
            return res.json(toSend);
        }
      );
    }

    if (!calls)
      return res.send(400);
  });
};




/**
 * addGraph:
 * *********
 * This route will add a graph and its meta object to a space.
 *
 * Params:
 *   - id: string
 *       The space ID.
 *   - meta: ?object
 *       Eventually the new meta object.
 *   - graph: ?object
 *       Eventually the new graph object.
 */
exports.addGraph = function(req, res) {
  var params = {
    id: req.params.id,
    meta: req.body.meta,
    graph: req.body.graph
  };

  // Check params:
  if (!struct.check(
    {
      id: 'string',
      meta: '?object',
      graph: '?object'
    },
    params
  ))
    return res.send(400);

  // Check authorizations:
  if (!(req.session.spaces || {})[params.id])
    return res.send(401);

  // Check authorizations:
  if (!(req.session.spaces || {})[params.id])
    return res.send(401);

  models.space.get(params.id, function(err, spaceResult) {
    if (err) {
      console.log('controllers.space.addGraph: unknown error retrieving the graph object.');
      console.log('  -> Message: ' + err.message);
      return res.send(500);
    }

    models.graph.set(params.graph || {}, function(err, graphResult) {
      if (err) {
        console.log('controllers.space.addGraph: unknown error setting the graph object.');
        console.log('  -> Message: ' + err.message);
        return res.send(500);
      }

      models.graphMeta.set(params.meta || {}, function(err, graphMetaResult) {
        if (err) {
          console.log('controllers.space.addGraph: unknown error setting the graph meta object.');
          console.log('  -> Message: ' + err.message);
          return res.send(500);
        }

        var data = spaceResult;
        data.graphs = data.graphs || [];
        data.graphs.push({
          id: graphResult.id,
          metaId: graphMetaResult.id
        });

        models.space.set(
          data,
          params.id,
          function(err, spaceResult) {
            if (err) {
              console.log('controllers.space.addGraph: unknown error updating the space object.');
              console.log('  -> Message: ' + err.message);
              return res.send(500);
            }

            var date = Date.now();

            // Add space, graphs metas and graphs to the session:
            req.session.graphs = req.session.graphs || {};
            req.session.graphMetas = req.session.graphMetas || {};

            req.session.graphs[graphResult.id] = date;
            req.session.graphMetas[graphMetaResult.graphs[0].metaId] = date;

            return res.json({
              id: spaceResult.id,
              email: spaceResult.value.email,
              version: spaceResult.value.graphs.length
            });
          }
        );
      });
    });
  });
};
