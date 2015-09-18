/**
 * Created by Phuc on 9/9/2015.
 */
!function () {

  var angular = require('angular');
  var _isUndefined = angular.isUndefined;
  var _extend = angular.extend;
  var _clone = angular.copy;
  var template = require('./templates/tm-controls.html');

  var Directive = function ($store) {

    var link = function ($scope, $element, $attr) {
      var appName = $scope.appName || '';

      function getStorageKey(key) {
        return appName + '.' + key;
      }

      $scope.histories = $store.getPersistStorage().get(getStorageKey('__time_machine_histories')) || [];
      $store.register($scope, 'timeline_index', function (state) {
        var index;
        if (_isUndefined(state.__time_machine)) {
          var cState = _clone(state);
          index = cState.__time_machine = $scope.histories.length;
          $scope.histories.push(cState);
        }
        else {
          index = state.__time_machine;
        }
        return index;
      });

      $scope.go = function (step) {
        var index = $scope.timeline_index + step;
        if (index >= 0 && index < $scope.histories.length) {
          var state = $scope.histories[index];
          $store.applyState(state);
        }
      };

      $scope.frozenTime = function (timelineIndex) {

        if (timelineIndex == 0) {
          alert('Nothing happened yet...');
          return;
        }

        var Storage = $store.getPersistStorage();
        Storage.set(getStorageKey('__time_machine_frozen'), timelineIndex);
        Storage.set(getStorageKey('__time_machine_histories'), $scope.histories);
        window.location.reload();
      };

      $scope.unFreeze = function () {
        var Storage = $store.getPersistStorage();
        Storage.remove(getStorageKey('__time_machine_frozen'));
        Storage.remove(getStorageKey('__time_machine_histories'));
        window.location.reload();
      }
    };

    /// directive declaration
    return {
      scope: {
        inFrozen: '@inFrozen',
        appName: '@appName'
      },
      template: template,
      link: link
    }
  };

  module.exports = Directive;

}.call(this);

