/**
 * Created by Phuc on 9/10/2015.
 */
!function () {

  var angular = require('angular');
  var _extend = angular.extend;
  var _forEach = angular.forEach;
  var Store = require('./ng-store');
  var JsonPatch = require('fast-json-patch');

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  class FocusStore extends Store {

    constructor(Actions, $q, $ajax, initialState) {
      super(Actions, $q, $ajax, initialState);
      this.observer = JsonPatch.observe(this.state, (patches) => {
        this.markFocusSelectors(patches);
      });
      this.nextTriggerSelectors = [];
    }

    __makeSelector($scope, scopeAttrMap, handleDef, storePaths = null) {

      var selector = super.__makeSelector($scope, scopeAttrMap, handleDef);

      if (storePaths !== null) {
        selector.storePaths = storePaths;
      }

      return selector;
    }

    register($scope, storePaths, handleDef, skipFirstTime) {
      return super.__register(this.__makeSelector($scope, null, handleDef, storePaths), skipFirstTime);
    }

    markFocusSelectors(patches) {

      var nextTriggerSelectors = [];

      patches.forEach((patch) => {
        nextTriggerSelectors.concat(this.selectors.filter((selector) => {
          return !selector.storePaths || selector.storePaths.some((path) => {
                return path.indexOf(patch.path);
              });
        }));
      });

      this.nextTriggerSelectors = nextTriggerSelectors;
    }

    __getSelectors() {
      return this.nextTriggerSelectors;
    }

  }

  module.exports = FocusStore;

}.call(this);
