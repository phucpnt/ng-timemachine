/**
 * Created by Phuc on 9/9/2015.
 */
!function () {

  var angular = require('angular');
  var _isUndefined = angular.isUndefined;
  var _extend = angular.extend;


  var Directive = function ($store) {

    var link = function ($scope, $element, $attr) {
      var appName = $scope.appName || '';

      function getStorageKey(key) {
        return appName + '.' + key;
      }

      $scope.histories = $store.getPersistStorage().get(getStorageKey('__time_machine_histories')) || [];
      $store.register(function (state) {
        return state;
      }, function (state) {
        if (_isUndefined(state.__time_machine)) {
          state.__time_machine = $scope.histories.length;
          state.loading_state = _extend({}, state.loading_state); // not deep clone
          $scope.timeline_index = $scope.histories.length;
          $scope.histories.push(state);
        }
        else {
          $scope.timeline_index = state.__time_machine;
        }
      });

      $scope.go = function (step) {
        var index = $scope.timeline_index + step;
        if (index > 0 && index < $scope.histories.length) {
          var state = $scope.histories[index];
          console.log(state.loading_state);
          $store.applyState(state);
        }
      };

      $scope.frozenTime = function (timelineIndex) {
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
      link: link
    }
  };

  function Inject(appName, $compile, $rootElement, $rootScope, $store) {
    var $element = angular.element('<div time-machine />').attr('data-app-name', appName);
    require(['storejs'], function (Storage) {
      $store.setPersistStorage(Storage);
      var frozenIndex = Storage.get(appName + '.__time_machine_frozen');
      var histories = Storage.get(appName + '.__time_machine_histories');
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

    });
  }

  module.exports = Directive;

}.call(this);

