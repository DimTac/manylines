;(function() {
  'use strict';

  app.pkg('app.modules');
  app.modules.basemap = function(dom, d) {
    var self = this,
        s = d.get('mainSigma'),
        renderer = s.addRenderer({
          container: $('.sigma-panel .sigma-expand', dom)[0],
          camera: 'mainCamera',
          id: 'tubemynet-basemap'
        });

    // Refresh rendering:
    s.refresh();

    // Bind sigma buttons:
    $('*[data-app-basemap-action="zoom"]', dom).click(function() {
      var cam = s.cameras.mainCamera;

      sigma.misc.animation.camera(
        cam,
        { ratio: cam.ratio / 1.5 },
        { duration: 150 }
      );
    });
    $('*[data-app-basemap-action="unzoom"]', dom).click(function() {
      var cam = s.cameras.mainCamera;

      sigma.misc.animation.camera(
        cam,
        { ratio: cam.ratio * 1.5 },
        { duration: 150 }
      );
    });
    $('*[data-app-basemap-action="recenter"]', dom).click(function() {
      var cam = s.cameras.mainCamera;

      sigma.misc.animation.camera(
        cam,
        { x: 0,
          y: 0,
          angle: 0,
          ratio: 1 },
        { duration: 150 }
      );
    });

    // Columns layout
    function openForcePanel() {
      dom.filter('*[data-app-basemap-panel="sigma"]').removeClass('col-xs-9').addClass('col-xs-6');
      dom.filter('*[data-app-basemap-panel="force"]').show();
      $('.forcelayout-container .tirette', dom).hide();
      renderer.resize();
      renderer.render();
    }

    function closeForcePanel() {
      dom.filter('*[data-app-basemap-panel="sigma"]').removeClass('col-xs-6').addClass('col-xs-9');
      dom.filter('*[data-app-basemap-panel="force"]').hide();
      $('.forcelayout-container .tirette', dom).show();
      renderer.resize();
      renderer.render();
    }

    // Bind layout:
    $('*[data-app-basemap-action="startLayout"]', dom).click(function(e) {
      $('div[data-app-basemap-switchlayout]', dom).attr('data-app-basemap-switchlayout', 'on');
      s.startForceAtlas2();
      openForcePanel();
      e.preventDefault();
    });
    $('*[data-app-basemap-action="stopLayout"]', dom).click(function(e) {
      $('div[data-app-basemap-switchlayout]', dom).attr('data-app-basemap-switchlayout', 'off');
      s.stopForceAtlas2();
      e.preventDefault();
    });

    // Other buttons:
    $('.forcelayout-container .tirette', dom).click(function(e) {
      openForcePanel();
      e.preventDefault();
    });
    dom.filter('*[data-app-basemap-panel="force"]').find('.tirette').click(function(e) {
      closeForcePanel();
      e.preventDefault();
    });

    this.kill = function() {
      s.killForceAtlas2().killRenderer('tubemynet-basemap');
    };
  };
}).call(this);
