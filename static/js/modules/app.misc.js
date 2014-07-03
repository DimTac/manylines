;(function() {
  'use strict';

  app.pkg('app.modules');

  /**
   * The module that sets with the URL.
   */
  app.modules.location = function() {
    var stored,
        self = this;

    if ('onhashchange' in window)
      window.onhashchange = function() {
        hashChanged(window.location.hash);
      };
    else {
      stored = window.location.hash;
      window.setInterval(function() {
        if (window.location.hash !== stored) {
          stored = window.location.hash;
          hashChanged(stored);
        }
      }, 100);
    }

    function hashChanged() {
      self.dispatchEvent('hashUpdated', {
        hash: window.location.hash
      });
    }

    this.triggers.events.updateHash = function(d, e) {
      var hash = e.data.hash;

      if (stored !== hash) {
        stored = hash;
        d.log('Update hash:', hash);
        window.location.hash = hash;
      }
    }
  };

  /**
   * This module will store locally the unsaved changes, using the LocalStorage
   * API.
   */
  app.modules.localStorage = function(d) {
    var self = this;

    // Detect browser support:
    var mod = 'app-ls-support';
    app.pkg('app.support');
    try {
      localStorage.setItem(mod, mod);
      localStorage.removeItem(mod);
      app.support.webStorage = true;
    } catch(e) {
      app.support.webStorage = false;
    }

    function save() {
      if (!d.get('dataLoaded'))
        return false;

      var data = {};

      data.meta = d.get('meta');
      data.graph = d.get('graph');
      data.isModified = d.get('isModified');

      localStorage.setItem(
        app.defaults.storageKey,
        JSON.stringify(data)
      );
    }

    function load() {
      var k,
          data = localStorage.getItem(app.defaults.storageKey);

      try {
        data = JSON.parse(data);
      } catch(e) {
        data = null;
      }

      self.dispatchEvent('localStorageLoaded', data);
    };

    // Removing the 'app-current' key from localStorage.
    function clean() {
      localStorage.removeItem(app.defaults.storageKey);
    }

    if (app.support.webStorage) {
      this.triggers.events.dataUpdated = save;
      this.triggers.events.isModifiedUpdated = save;
      this.triggers.events.loadLocalStorage = load;
    }
  };

  /**
   * The ad-hoc module to deal with views navigation.
   */
  app.modules.viewsPanel = function(d) {
    var self = this;
    app.dom.on('click', '*[data-app-updateView]', function(e) {
      var target = $(e.target);
      target = target.attr('data-app-updateView') ?
        target :
        target.parents('[data-app-updateView]');

      if (!target.hasClass('todo') && !target.hasClass('disabled'))
        self.dispatchEvent('updateView', {
          view: target.attr('data-app-updateView')
        });

      e.stopPropagation();
      return false;
    });
  };

  /**
   * The form to create a space.
   */
  app.modules.spaceForm = function(d) {
    var modal,
        self = this;

    this.triggers.events.spaceIdUpdated = function(d) {
      if (modal)
        modal.add($('body > .modal-backdrop')).remove();
    };

    this.triggers.events.openSpaceForm = function(d) {
      // Lock UI until the template is loaded:
      self.dispatchEvent('lock');

      app.templates.require('app.spaceForm', function(template) {
        self.dispatchEvent('unlock');

        if (modal)
          modal.add('body > .modal-backdrop').remove();

        function save() {
          var email = $('#space-email', modal).val(),
              password = $('#space-password', modal).val();

          if (email && password)
            self.dispatchEvent('createSpace', {
              email: email,
              password: password
            });
          else if (!email)
            app.info(i18n.t('warnings.missing_email'));
          else if (!password)
            app.info(i18n.t('warnings.missing_password'));
        }

        // Initialize new modal:
        modal = $(template()).i18n().modal();

        // Bind event listeners:
        $('button.close', modal).click(function() {
          modal.add($('body > .modal-backdrop')).remove();
        });
        $('#space-save', modal).click(save);
        $('input', modal).keypress(function(e) {
          if (e.which === 13)
            save();
        });
      });
    };
  };

  /**
   * The save button and its states
   */
  app.modules.saveButton = function(d) {

    // Selectors
    var button = $('.save.save-alert > a');

    // Receptors
    this.triggers.events.saving = function(d, e) {
      button.text(i18n.t('main.saving'));
    };

    this.triggers.events.saved = function(d, e) {
      button.text(i18n.t('main.not_saved_yet'));
    };
  };


  /**
   * **************************
   * GENERIC DOM DOMINO MODULES
   * **************************
   */

  /**
   * A basic DOM module to dispatch an event when a DOM element is clicked. The
   * content of this event is specified in "obj".
   */
  app.modules.domClick = function(event, domElement) {
    var self = this;
    domElement.click(function(e) {
      self.dispatchEvent(event);
      e.stopPropagation();
      return false;
    });
  };

  /**
   * A basic DOM module that shows an element when a property is true and hide
   * it when it's falsy.
   */
  app.modules.domShow = function(property, domElement) {
    this.triggers.properties[property] = function(d) {
      if (d.get(property))
        domElement.show();
      else
        domElement.hide();
    };
  };

  /**
   * A basic DOM module that shows an element when a property is falsy and hide
   * it when it's truthy.
   */
  app.modules.domHide = function(property, domElement) {
    this.triggers.properties[property] = function(d) {
      if (d.get(property))
        domElement.hide();
      else
        domElement.show();
    };
  };
}).call(this);
