/**
 * Created by Phuc on 9/10/2015.
 */
!function () {

  var angular = require('angular');
  var _forEach = angular.forEach;
  var _isArray = angular.isArray;
  var Store = require('./ng-store');
  var JsonPatch = require('fast-json-patch');
  var ObjectPath = require('object-path');

  /**
   * The aims of Focus Store:
   *
   *   * When state change on specific fields, focus store only delivery `trigger` to directive which register to specific
   *   that fields.
   *   * It is inspired by JSON Patch [RFC6902](https://tools.ietf.org/html/rfc6902), [jsonpatch.com](http://jsonpatch.com),
   *   [JSON-Patch](https://github.com/Starcounter-Jack/JSON-Patch)
   *
   */
  class FocusStore extends Store {

    constructor(Actions, $q, $ajax, initialState) {
      super(Actions, $q, $ajax, initialState);
      this.observer = JsonPatch.observe(this.state);
    }

    __makeSelector($scope, scopeAttrMap, handleDef, storePaths = null) {

      var selector = super.__makeSelector($scope, scopeAttrMap, handleDef);

      if (storePaths !== null) {
        selector.storePaths = _isArray(storePaths) ? storePaths : [storePaths];
      }

      return selector;
    }

    register($scope, storePaths, handleDef, skipFirstTime) {
      return super.__register(this.__makeSelector($scope, null, handleDef, storePaths), skipFirstTime);
    }

    getFocusSelectors(patches) {

      var nextTriggerSelectors = [];

      patches.forEach((patch) => {
        Array.prototype.push.apply(nextTriggerSelectors, this.selectors.filter((selector) => {
          return !selector.storePaths || selector.storePaths.some((path) => {
                return patch.path.indexOf('/' + path) === 0;
              });
        }));
      });

      return nextTriggerSelectors;

    }

    __getSelectors(state) {
      var patches = JsonPatch.generate(this.observer);
      return this.getFocusSelectors(patches);
    }

    __execSelectorHandler(selector, state = null) {

      if (state == null) {
        state = this.state;
      }

      var handleDef = selector.handleDef;
      var $scope = selector.$scope;

      var argsPick = selector.storePaths.map((path) => {
        return angular.copy(ObjectPath.get(state, path.replace('/', '.')));
      });

      var result;
      if (!selector.handleDef) {
        result = argsPick;
      }
      else {
        var fn, fnArgs = [];
        if (angular.isArray(handleDef)) {
          fn = handleDef[handleDef.length - 1];
          fnArgs = handleDef.slice(0, handleDef.length - 1);
        }
        else {
          fn = handleDef;
        }
        fnArgs.unshift.apply(fnArgs, argsPick);
        if (typeof fn === 'string') {
          result = this[fn].apply(this, fnArgs);
        }
        else {
          result = fn.apply(null, fnArgs);
        }
      }

      _forEach(result, (value, attr) => {
        $scope[attr] = value;
      });

      return true;
    }

  }

  module.exports = FocusStore;

}.call(this);
