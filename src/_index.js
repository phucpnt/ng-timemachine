/**
 * Created by Phuc on 9/28/2015.
 */

var angular = require('angular');
var Storage = require('store');
var Store = require('./tm-store');

import * as $const from './_const';

module.exports = function (StoreProvider) {
  var _extend = angular.extend;
  var app = angular.module('ngTimeMachine', []);

  app.value('tmAppName', '__need_your_app_name_override__');

  /**
   * refactor this: flexible Store class usage
   */
  app.provider('tmStore', StoreProvider);

  app.directive('timeControls', ['tmStore', require('./tm-controls')]);
  app.service('setupTimeControls', ['tmAppName', '$compile', '$rootElement', '$rootScope', 'tmStore',
    function (appName, $compile, $rootElement, $rootScope, $store) {
      return {
        start: ()=> {
          var $element = angular.element('<div time-controls />').attr('data-app-name', appName);
          $store.setPersistStorage(Storage);
          var frozenIndex = Storage.get([appName, $const.BSKeyIsfrozen].join('.'));
          var histories = Storage.get([appName, $const.BSKeyHistories].join('.'));
          var $nuScope = $rootScope.$new();
          if (frozenIndex) {
            $element.attr({
              'data-frozen-index': frozenIndex,
              'data-in-frozen': 1
            });
            $nuScope.histories = histories;
          }
          $rootElement.append($element);
          $compile($element[0])($nuScope);

          if (frozenIndex) {
            var nuState = _extend({}, histories[frozenIndex]);
            delete nuState.__time_machine;
            $store.applyState(nuState, true);
          }
          else {
            $store.execute();
          }
        }
      };

    }]);

  app.run(['setupTimeControls', function (setupTimeControls) {
    setupTimeControls.start();
  }]);

  return app;
};
