;(function() {
  'use strict';

  app.pkg('app.modules');

  app.modules.layout = function(control) {
    var self = this,
        module;

    function bindDOM(dom) {
      /**
       * This function checks if a DOM element is already used in a app module
       * or not, by marking it with a DOM attribute:
       */
      function checkModule(dom, module) {
        if (dom.data('app-module-' + module))
          return false;
        else
          return dom.attr('data-app-module-' + module, 'true');
      }

      // Simple modules:
      [
        'domShow',
        'domHide',
        'domClick'
      ].forEach(function(module) {
        $('*[data-app-' + module + ']', dom).each(function() {
          var dom = $(this);
          if (checkModule(dom, module))
            control.addModule(app.modules[module], [dom.attr('data-app-' + module + ''), dom]);
        });
      });
    }

    // Various modules:
    control.addModule(app.modules.location);
    control.addModule(app.modules.spaceForm);
    control.addModule(app.modules.viewsPanel);
    control.addModule(app.modules.localStorage);

    // DOM modules:
    bindDOM(app.dom);

    // Bind layout triggers:
    this.triggers.events.viewUpdated = function(d) {
      var template,
          view = d.get('view');

      // Update DOM view:
      app.dom.attr('data-app-view', view);

      // Lock UI until the template is loaded:
      self.dispatchEvent('lock');

      // Load and render template:
      app.templates.require('app.' + view, function(template) {
        var dom = $(template()).i18n();
        $('.main', app.dom).empty().filter(':visible').append(dom);

        // Reinitialize module:
        if (module)
          control.killModule(module);

        module = control.addModule(app.modules[view], [dom]);

        // Unlock UI:
        self.dispatchEvent('unlock');
      });
    };
  };
}).call(this);