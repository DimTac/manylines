/**
 * TubeMyNet Space Controller
 * ===========================
 *
 */
var validator = require('validator');

var repositories = {
  login: require('../repositories/login.js'),
  space: require('../repositories/space.js')
};

// Actions definition
module.exports = {

  /**
   * login:
   * ------
   * This route will log an user into a precise space.
   *
   */
  login: {
    validate: {
      id: 'string',
      password: 'string'
    },
    method: function(req, res) {
      var id = req.param('id'),
          password = req.param('password');

      // Checking login
      repositories.login.authenticate(id, password, function(result) {

        // Fail
        if (!result)
          return res.error('Unauthorized', 401);

        // Success - we had the space to the session and we reply
        req.session.spaces = req.session.spaces || {};
        req.session.spaces[id] = result;

        return res.json({
          id: id,
          email: result.email,
          version: result.graphs.length
        });
      });
    }
  },

  /**
   * logout:
   * *******
   * This route is able to log a user off a precise space or every spaces if
   * no space id is specified.
   *
   */
  logout: {
    validate: {
      id: '?string'
    },
    policies: 'authenticated',
    method: function(req, res) {
      var id = req.param('id');

      if (id) {

        // We remove the given space from user's session
        delete req.session.spaces[id];
      }
      else {

        // We remove every spaces from user's session
        delete req.session.spaces;
      }

      // Reply
      return res.json({ok: true});
    }
  },

  /**
   * create:
   * *******
   * This route will create a new space, with an empty graph object attached
   * to it.
   *
   */
  create: {
    validate: {
      email: 'string',
      password: 'string',
      graph: {
        nodes: 'array',
        edges: 'array'
      },
      metas: 'object'
    },
    method: function(req, res) {
      var email = req.param('email'),
          password = req.param('password');

      // Custom errors on invalid email or password
      if (!validator.isEmail(email))
        return res.error('INVALID_EMAIL', 400);
      if (!validator.isLength(password, 5))
        return res.error('INVALID_PASSWORD', 400);

      // Initializing the space
      repositories.space.initialize(
        email,
        password,
        req.param('graph'),
        req.param('metas'),
        function(err, space) {
          if (err)
            return res.error('Error on space initialization.');

          // Starting a session and sending reply
          req.session.spaces = req.session.spaces || {};
          req.session.spaces[space.id] = space;

          return res.json({
            id: space.id,
            email: space.email,
            version: 1
          });
        }
      );
    }
  }
};
