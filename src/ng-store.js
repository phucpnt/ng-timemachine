/**
 * Created by Phuc on 9/10/2015.
 */
!function () {

  var angular = require('angular');
  var _extend = angular.extend;
  var _forEach = angular.forEach;


  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  class Store {

    constructor(Actions, $q, $ajax, initialState) {

      this.Actions = Actions;
      this.selectors = [];
      this.$q = $q;
      this.$ajax = $ajax;
      this.cached = {};

      initialState = _extend(this.initialState(), initialState);

      this.state = initialState;

      for (var name in Actions) {
        var fnName = 'on' + capitalize(name);
        if (typeof(this[fnName]) === 'function') {
          Actions[name].add(this[fnName], this);
        }
      }
    }

    initialState() {
      return {
        loading_state: []
      };
    }

    execute() {
      this.__initSetup();
    }

    dispatch(action) {
      var Actions = this.Actions;
      if (Actions[action]) {
        Actions[action].dispatch.apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }

    register($scope, scopeAttrMap, handleDef, skipFirstTime) {
      var index = this.selectors.length;
      var selector = {$scope: $scope, attrMap: scopeAttrMap, handleDef: handleDef};
      this.selectors.push(selector);

      // free memory
      $scope.$on('$destroy', function (index, store) {
        return function () {
          store.selectors.slice(index, 1);
        }
      }(index, this));

      if (!skipFirstTime) {
        this.__execSelectorHandler(selector);
      }
    }

    __execSelectorHandler(selector, state = null) {

      if (state == null) {
        state = this.state;
      }

      var handleDef = selector.handleDef;
      var $scope = selector.$scope;
      var attrMap = selector.attrMap;

      var result;
      if (!selector.handleDef) {
        result = this.state;
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
        fnArgs.unshift(angular.extend({}, state));
        if (typeof fn === 'string') {
          result = this[fn].apply(this, fnArgs);
        }
        else {
          result = fn.apply(null, fnArgs);
        }
      }

      if (angular.isString(attrMap)) {
        selector.$scope[attrMap] = angular.copy(result);
      }
      else {
        _forEach(attrMap, (scopeAttr, resultAttr) => {
          $scope[scopeAttr] = angular.copy(result[resultAttr]);
        })
      }
      return true;
    }

    trigger(state, force) {
      //console.log('%c >> trigger delay in flow', 'background: yellow', this.__trigger_depth);
      if (!force && this.__trigger_depth) {
        return;
      }

      for (var i = 0; i < this.selectors.length; i++) {
        var selector = this.selectors[i];
        this.__execSelectorHandler(selector, state);
      }

      return true;
    }

    flowStart(promise) {
      this.__trigger_depth = this.__trigger_depth ? this.__trigger_depth + 1 : 1;
      console.log('%c >> flow start', 'background: yellow', this.__trigger_depth);

      if (promise && typeof promise.then === 'function') {
        return promise;
      }

      return this.$q((resolve, reject) => {
        resolve(promise);
      })
    }

    flowEnd(state) {
      this.__trigger_depth--;
      //console.log('%c >> flow end', 'background: yellow', this.__trigger_depth);
      if (this.__trigger_depth <= 0) {
        this.__trigger_depth = 0;
        this.trigger(state);
      }
    }


    /***
     * common store functions
     */
    applyState(state, override) {
      if (override) {
        this.state = _extend(this.initialState(), state);
      }
      this.trigger(state);
    }

    setPersistStorage(storage) {
      this.pStorage = storage
    }

    getPersistStorage() {
      return this.pStorage;
    }

    mixIn(...mixins) {
      mixins.reverse().forEach((mixinFn) => {
        var mixin = mixinFn(this);
        for (var key in mixin) {
          var currentFn = this[key];
          this[key] = mixin[key].call(this, currentFn);
        }
      });
    }


    /******************
     * private function & async query
     ******************/
    __markLoading(name, state) {
      if (typeof name != 'string') {
        name = JSON.stringify(name);
      }
      if (state == false) {
        var foundIndex = this.state.loading_state.indexOf(name);
        if (foundIndex > -1) {
          this.state.loading_state.splice(foundIndex, 1);
        }

      }
      else if (this.state.loading_state.indexOf(name) > -1) {
        state = false;
      }
      else {
        this.state.loading_state.push(name);
      }

      if (state) {
        var loadingDeps = this.__getLoadingStateDeps()[name];
        _forEach(loadingDeps, (name) => {
          this.state.loading_state.push(name);
        });
        this.trigger(this.state, true);
      }
    }

    __getLoadingStateDeps() {
      return {};
    }

    __request(label, url, params, method = 'JSONP', opts = {}) {
      console.log(label);
      this.__markLoading(label, true);
      var defer = this.$q.defer();

      var requestParams = {
        method: method,
        url: url
      };

      if (method === 'JSONP' || method === 'GET') {
        requestParams.params = params;
      }
      /**
       * FIXME: need test
       */
      switch (method) {
        case 'JSONP':
          if (url.indexOf('?') >= -1) {
            url = url + 'JSON_CALLBACK';
          }
          else {
            url = url + '?JSON_CALLBACK';
          }
          requestParams.params = params;
          break;
        case 'GET':
          requestParams.params = params;
          break;
        default:
          requestParams.data = params;
      }

      this.$ajax(_extend(requestParams, opts))
          .then((response) => {
            this.__markLoading(label, false);
            defer.resolve(response);
          }, (error) => {
            defer.reject(error);
          }
      );

      return defer.promise;
    }

    __fromCached(key) {

      if ((key)) {
        key = JSON.stringify(key);
      }
      var chainOr;
      if (this.cached[key]) {
        chainOr = () => {
          var defer = this.$q.defer();
          defer.resolve(this.cached[key]);
          return defer.promise;
        }
      }
      else {
        chainOr = () => {
          var fn = arguments[0];
          return fn.apply(self, Array.prototype.slice.call(arguments, 1));
        }
      }
      return {or: chainOr};
    }

    __initSetup() {
    }

  }

  module.exports = Store;

}.call(this);
