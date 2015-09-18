/**
 * Created by Phuc on 9/9/2015.
 */

var angular = require('angular');
var cssify = require('cssify');
var Storage = require('store');

var app = angular.module('ngTimeMachine', []);
app.value('tmAppName', '__need_your_app_name_override__');
app.provider('tmStore', function tmStore() {

  var Store = require('./tm-store');
  var Actions = null;
  var StoreClass = null;
  var initialState = {};

  this.defineStore = function (storeDefs) {
    StoreClass = Store.createClass(storeDefs)
  };
  this.defineActions = function (actions) {
    Actions = Store.makeActions(actions);
  };
  this.initialState = function (state) {
    initialState = state;
  };

  this.$get = ['$q', '$http', function storeFactory($q, $http) {
    return new StoreClass(Actions, $q, $http, initialState);
  }]

});

app.directive('timeControls', ['tmStore', require('./tm-controls')]);

app.run(['tmAppName', '$compile', '$rootElement', '$rootScope', 'tmStore',
  function (appName, $compile, $rootElement, $rootScope, $store) {
    var $element = angular.element('<div time-controls />').attr('data-app-name', appName);
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

  }]);

