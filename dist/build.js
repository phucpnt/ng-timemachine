(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/**
 * Created by Phuc on 9/10/2015.
 */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

!(function () {

  var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);
  var _extend = angular.extend;
  var _forEach = angular.forEach;

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  var Store = (function () {
    function Store(Actions, $q, $ajax, initialState) {
      _classCallCheck(this, Store);

      this.Actions = Actions;
      this.selectors = [];
      this.$scopes = [];
      this.$q = $q;
      this.$ajax = $ajax;
      this.cached = {};

      initialState = _extend(this.initialState(), initialState);

      this.state = initialState;

      for (var name in Actions) {
        var fnName = 'on' + capitalize(name);
        if (typeof this[fnName] === 'function') {
          Actions[name].add(this[fnName], this);
        }
      }
    }

    _createClass(Store, [{
      key: 'initialState',
      value: function initialState() {
        return {
          loading_state: []
        };
      }
    }, {
      key: 'execute',
      value: function execute() {
        this.__initSetup();
      }
    }, {
      key: 'dispatch',
      value: function dispatch(action) {
        var Actions = this.Actions;
        if (Actions[action]) {
          Actions[action].dispatch.apply(this, Array.prototype.slice.call(arguments, 1));
        }
      }
    }, {
      key: 'register',
      value: function register(selector, handler, skipFirstTime) {
        this.selectors.push({ selector: selector, handler: handler });
        if (!skipFirstTime) {
          handler(_extend({}, selector(this.state)));
        }
      }
    }, {
      key: 'bindScope',
      value: function bindScope($scope) {
        this.$scopes.push($scope);
      }
    }, {
      key: '$digest',
      value: function $digest() {
        //for (var i = 0; i < this.$scopes.length; i++) {
        //  var $scope = this.$scopes[i];
        //  if (!$scope.$$phase) {
        //    //$digest or $apply
        //    $scope.$digest();
        //  }
        //}
      }
    }, {
      key: 'trigger',
      value: function trigger(state, force) {
        console.log('%c >> trigger delay in flow', 'background: yellow', this.__trigger_depth);
        if (!force && this.__trigger_depth) {
          return;
        }
        for (var i = 0; i < this.selectors.length; i++) {
          var selector = this.selectors[i];
          selector.handler(selector.selector(_extend({}, state)));
        }
        this.$digest();
        console.log('%c ============ <<<< CURRENT STATE >>> ========= ', 'background: blue; color: white', state, '======================================');
      }
    }, {
      key: 'flowStart',
      value: function flowStart(promise) {
        this.__trigger_depth = this.__trigger_depth ? this.__trigger_depth + 1 : 1;
        console.log('%c >> flow start', 'background: yellow', this.__trigger_depth);

        if (typeof promise.then === 'function') {
          return promise;
        }
        return this.$q(function (resolve, reject) {
          resolve(promise);
        });
      }
    }, {
      key: 'flowEnd',
      value: function flowEnd(state) {
        this.__trigger_depth--;
        console.log('%c >> flow end', 'background: yellow', this.__trigger_depth);
        if (this.__trigger_depth == 0) {
          this.trigger(state);
        }
      }

      /***
       * common store functions
       */
    }, {
      key: 'applyState',
      value: function applyState(state, override) {
        if (override) {
          this.state = _extend(this.initialState(), state);
        }
        this.trigger(state);
      }
    }, {
      key: 'setPersistStorage',
      value: function setPersistStorage(storage) {
        this.pStorage = storage;
      }
    }, {
      key: 'getPersistStorage',
      value: function getPersistStorage() {
        return this.pStorage;
      }

      /******************
       * private function & async query
       ******************/
    }, {
      key: '__markLoading',
      value: function __markLoading(name, state) {
        var found = false;
        _forEach(this.state.loading_state, function (item) {
          if (item.name === name) {
            item.state = state;
            found = true;
          }
        });

        if (!found) {
          this.state.loading_state.push({ name: name, state: state });
        }

        this.trigger(this.state, true);
      }
    }, {
      key: '__request',
      value: function __request(label, url, params) {
        var _this = this;

        var method = arguments.length <= 3 || arguments[3] === undefined ? 'JSONP' : arguments[3];
        var opts = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

        this.__markLoading(label, true);
        var defer = this.$q.defer();

        var requestParams = {
          method: method,
          url: url
        };

        if (method === 'JSONP' || method === 'GET') {
          requestParams.params = params;
        }
        switch (method) {
          case 'JSONP':
            if (url.indexOf('?') >= -1) {
              url = url + 'JSON_CALLBACK';
            } else {
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

        this.$ajax(_extend(requestParams, opts)).then(function (response) {
          _this.__markLoading(label, false);
          defer.resolve(response);
        }, function (error) {
          defer.reject(error);
        });

        return defer.promise;
      }
    }, {
      key: '__fromCached',
      value: function __fromCached(key) {
        var _this2 = this,
            _arguments = arguments;

        if (key) {
          key = JSON.stringify(key);
        }
        var chainOr;
        if (this.cached[key]) {
          chainOr = function () {
            var defer = _this2.$q.defer();
            defer.resolve(_this2.cached[key]);
            return defer.promise;
          };
        } else {
          chainOr = function () {
            var fn = _arguments[0];
            return fn.apply(self, Array.prototype.slice.call(_arguments, 1));
          };
        }
        return { or: chainOr };
      }
    }, {
      key: '__initSetup',
      value: function __initSetup() {}
    }]);

    return Store;
  })();

  module.exports = Store;
}).call(undefined);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
(function (global){
/**
 * Created by Phuc on 9/9/2015.
 */

'use strict';

var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);

var app = angular.module('ngTimeMachine', []);

app.directive('timeControls', function () {});
app.factory('tmStore', ['$q', require('./tm-store')]);
app.run([function () {}]);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./tm-store":3}],3:[function(require,module,exports){
/**
 * Created by Phuc on 9/10/2015.
 */

'use strict';

module.exports = function ($q) {

  var Store = {};
  var ClassStore = require('./class-store');
  var instance = null;

  Store.Define = function (actions, storeDefs) {};

  return Store;
};

},{"./class-store":1}]},{},[2])


//# sourceMappingURL=build.js.map