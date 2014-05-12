;(function() {
  'use strict';

  // DOM root:
  tbn.dom = tbn.dom || $('body');
  tbn.alertsDom = tbn.alertsDom || $('#tbn-alerts-container');

  // Default configuration:
  tbn.pkg('blf');
  tbn.config = tbn.config || {};
  tbn.config.i18n = tbn.config.i18n || {};
  tbn.config.lang = tbn.config.lang || 'en';
  tbn.config.i18nURL = tbn.config.i18nURL || '/locales/__lng__/__ns__.json'

  // Load dictionary:
  i18n.init({
    lng: tbn.config.lang,
    fallbackLng: tbn.config.lang,
    resGetPath: tbn.config.i18nURL,
    ns: {
      namespaces: ['translation'],
      defaultNs: 'translation'
    }
  }, function(t) {
    // Translate DOM:
    tbn.dom.i18n();

    // Instanciate layout:
    tbn.control.addModule(tbn.modules.layout, [tbn.control]);

    // Trigger init hack:
    tbn.control.dispatchEvent('loadHash');
  });
}).call(this);
