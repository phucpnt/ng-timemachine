(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function (css, customDocument) {
  var doc = customDocument || document;
  if (doc.createStyleSheet) {
    var sheet = doc.createStyleSheet()
    sheet.cssText = css;
    return sheet.ownerNode;
  } else {
    var head = doc.getElementsByTagName('head')[0],
        style = doc.createElement('style');

    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(doc.createTextNode(css));
    }

    head.appendChild(style);
    return style;
  }
};

module.exports.byUrl = function(url) {
  if (document.createStyleSheet) {
    return document.createStyleSheet(url).ownerNode;
  } else {
    var head = document.getElementsByTagName('head')[0],
        link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = url;

    head.appendChild(link);
    return link;
  }
};

},{}],2:[function(require,module,exports){
/*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */
/*global define:false, require:false, exports:false, module:false, signals:false */

/** @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
 */

(function(global){

    // SignalBinding -------------------------------------------------
    //================================================================

    /**
     * Object that represents a binding between a Signal and a listener function.
     * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
     * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
     * @author Miller Medeiros
     * @constructor
     * @internal
     * @name SignalBinding
     * @param {Signal} signal Reference to Signal object that listener is currently bound to.
     * @param {Function} listener Handler function bound to the signal.
     * @param {boolean} isOnce If binding should be executed just once.
     * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
     * @param {Number} [priority] The priority level of the event listener. (default = 0).
     */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

        /**
         * Handler function bound to the signal.
         * @type Function
         * @private
         */
        this._listener = listener;

        /**
         * If binding should be executed just once.
         * @type boolean
         * @private
         */
        this._isOnce = isOnce;

        /**
         * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @memberOf SignalBinding.prototype
         * @name context
         * @type Object|undefined|null
         */
        this.context = listenerContext;

        /**
         * Reference to Signal object that listener is currently bound to.
         * @type Signal
         * @private
         */
        this._signal = signal;

        /**
         * Listener priority
         * @type Number
         * @private
         */
        this._priority = priority || 0;
    }

    SignalBinding.prototype = {

        /**
         * If binding is active and should be executed.
         * @type boolean
         */
        active : true,

        /**
         * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
         * @type Array|null
         */
        params : null,

        /**
         * Call listener passing arbitrary parameters.
         * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
         * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
         * @return {*} Value returned by the listener.
         */
        execute : function (paramsArr) {
            var handlerReturn, params;
            if (this.active && !!this._listener) {
                params = this.params? this.params.concat(paramsArr) : paramsArr;
                handlerReturn = this._listener.apply(this.context, params);
                if (this._isOnce) {
                    this.detach();
                }
            }
            return handlerReturn;
        },

        /**
         * Detach binding from signal.
         * - alias to: mySignal.remove(myBinding.getListener());
         * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
         */
        detach : function () {
            return this.isBound()? this._signal.remove(this._listener, this.context) : null;
        },

        /**
         * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
         */
        isBound : function () {
            return (!!this._signal && !!this._listener);
        },

        /**
         * @return {boolean} If SignalBinding will only be executed once.
         */
        isOnce : function () {
            return this._isOnce;
        },

        /**
         * @return {Function} Handler function bound to the signal.
         */
        getListener : function () {
            return this._listener;
        },

        /**
         * @return {Signal} Signal that listener is currently bound to.
         */
        getSignal : function () {
            return this._signal;
        },

        /**
         * Delete instance properties
         * @private
         */
        _destroy : function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
        }

    };


/*global SignalBinding:false*/

    // Signal --------------------------------------------------------
    //================================================================

    function validateListener(listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
        }
    }

    /**
     * Custom event broadcaster
     * <br />- inspired by Robert Penner's AS3 Signals.
     * @name Signal
     * @author Miller Medeiros
     * @constructor
     */
    function Signal() {
        /**
         * @type Array.<SignalBinding>
         * @private
         */
        this._bindings = [];
        this._prevParams = null;

        // enforce dispatch to aways work on same context (#47)
        var self = this;
        this.dispatch = function(){
            Signal.prototype.dispatch.apply(self, arguments);
        };
    }

    Signal.prototype = {

        /**
         * Signals Version Number
         * @type String
         * @const
         */
        VERSION : '1.0.0',

        /**
         * If Signal should keep record of previously dispatched parameters and
         * automatically execute listener during `add()`/`addOnce()` if Signal was
         * already dispatched before.
         * @type boolean
         */
        memorize : false,

        /**
         * @type boolean
         * @private
         */
        _shouldPropagate : true,

        /**
         * If Signal is active and should broadcast events.
         * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
         * @type boolean
         */
        active : true,

        /**
         * @param {Function} listener
         * @param {boolean} isOnce
         * @param {Object} [listenerContext]
         * @param {Number} [priority]
         * @return {SignalBinding}
         * @private
         */
        _registerListener : function (listener, isOnce, listenerContext, priority) {

            var prevIndex = this._indexOfListener(listener, listenerContext),
                binding;

            if (prevIndex !== -1) {
                binding = this._bindings[prevIndex];
                if (binding.isOnce() !== isOnce) {
                    throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                }
            } else {
                binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
            }

            if(this.memorize && this._prevParams){
                binding.execute(this._prevParams);
            }

            return binding;
        },

        /**
         * @param {SignalBinding} binding
         * @private
         */
        _addBinding : function (binding) {
            //simplified insertion sort
            var n = this._bindings.length;
            do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
            this._bindings.splice(n + 1, 0, binding);
        },

        /**
         * @param {Function} listener
         * @return {number}
         * @private
         */
        _indexOfListener : function (listener, context) {
            var n = this._bindings.length,
                cur;
            while (n--) {
                cur = this._bindings[n];
                if (cur._listener === listener && cur.context === context) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * Check if listener was attached to Signal.
         * @param {Function} listener
         * @param {Object} [context]
         * @return {boolean} if Signal has the specified listener.
         */
        has : function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        /**
         * Add a listener to the signal.
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        add : function (listener, listenerContext, priority) {
            validateListener(listener, 'add');
            return this._registerListener(listener, false, listenerContext, priority);
        },

        /**
         * Add listener to the signal that should be removed after first execution (will be executed only once).
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        addOnce : function (listener, listenerContext, priority) {
            validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, listenerContext, priority);
        },

        /**
         * Remove a single listener from the dispatch queue.
         * @param {Function} listener Handler function that should be removed.
         * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
         * @return {Function} Listener handler function.
         */
        remove : function (listener, context) {
            validateListener(listener, 'remove');

            var i = this._indexOfListener(listener, context);
            if (i !== -1) {
                this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                this._bindings.splice(i, 1);
            }
            return listener;
        },

        /**
         * Remove all listeners from the Signal.
         */
        removeAll : function () {
            var n = this._bindings.length;
            while (n--) {
                this._bindings[n]._destroy();
            }
            this._bindings.length = 0;
        },

        /**
         * @return {number} Number of listeners attached to the Signal.
         */
        getNumListeners : function () {
            return this._bindings.length;
        },

        /**
         * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
         * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
         * @see Signal.prototype.disable
         */
        halt : function () {
            this._shouldPropagate = false;
        },

        /**
         * Dispatch/Broadcast Signal to all listeners added to the queue.
         * @param {...*} [params] Parameters that should be passed to each handler.
         */
        dispatch : function (params) {
            if (! this.active) {
                return;
            }

            var paramsArr = Array.prototype.slice.call(arguments),
                n = this._bindings.length,
                bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (! n) {
                //should come after memorize
                return;
            }

            bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
            this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

            //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
            //reverse loop since listeners with higher priority will be added at the end of the list
            do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
        },

        /**
         * Forget memorized arguments.
         * @see Signal.memorize
         */
        forget : function(){
            this._prevParams = null;
        },

        /**
         * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
         * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
         */
        dispose : function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
        }

    };


    // Namespace -----------------------------------------------------
    //================================================================

    /**
     * Signals namespace
     * @namespace
     * @name signals
     */
    var signals = Signal;

    /**
     * Custom event broadcaster
     * @see Signal
     */
    // alias for backwards compatibility (see #gh-44)
    signals.Signal = Signal;



    //exports to multiple environments
    if(typeof define === 'function' && define.amd){ //AMD
        define(function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports){ //node
        module.exports = signals;
    } else { //browser
        //use string because of Google closure compiler ADVANCED_MODE
        /*jslint sub:true */
        global['signals'] = signals;
    }

}(this));

},{}],3:[function(require,module,exports){
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
      value: function register($scope, scopeAttrMap, handleDef, skipFirstTime) {
        var index = this.selectors.length;
        var selector = { $scope: $scope, attrMap: scopeAttrMap, handleDef: handleDef };
        this.selectors.push(selector);

        // free memory
        $scope.$on('$destroy', (function (index, store) {
          return function () {
            store.selectors.slice(index, 1);
          };
        })(index, this));

        if (!skipFirstTime) {
          this.__execSelectorHandler(selector);
        }
      }
    }, {
      key: '__execSelectorHandler',
      value: function __execSelectorHandler(selector) {
        var handleDef = selector.handleDef;
        var $scope = selector.$scope;
        var attrMap = selector.attrMap;

        var result;
        if (!selector.handleDef) {
          result = this.state;
        } else {
          var fn,
              fnArgs = [];
          if (angular.isArray(handleDef)) {
            fn = handleDef[handleDef.length - 1];
            fnArgs = handleDef.slice(0, handleDef.length - 1);
          } else {
            fn = handleDef;
          }
          fnArgs.unshift(this.state);
          if (typeof fn === 'string') {
            result = this[fn].apply(this, fnArgs);
          } else {
            result = fn.apply(null, fnArgs);
          }
        }

        if (angular.isString(attrMap)) {
          selector.$scope[attrMap] = angular.copy(result);
        } else {
          _forEach(attrMap, function (scopeAttr, resultAttr) {
            $scope[scopeAttr] = angular.copy(result[resultAttr]);
          });
        }
        return true;
      }
    }, {
      key: 'trigger',
      value: function trigger(state, force) {
        //console.log('%c >> trigger delay in flow', 'background: yellow', this.__trigger_depth);
        if (!force && this.__trigger_depth) {
          return;
        }

        var deferTrigger = this.$q.defer();
        var promise = deferTrigger.promise;

        for (var i = 0; i < this.selectors.length; i++) {
          var selector = this.selectors[i];
          this.__execSelectorHandler(selector);
        }

        promise.then(function () {
          console.log('%c ============ <<<< CURRENT STATE >>> ========= ', 'background: blue; color: white', state, '======================================');
        });

        deferTrigger.resolve(true);
        return promise;
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
        //console.log('%c >> flow end', 'background: yellow', this.__trigger_depth);
        if (this.__trigger_depth <= 0) {
          this.__trigger_depth = 0;
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
    }, {
      key: 'mixIn',
      value: function mixIn() {
        var _this = this;

        for (var _len = arguments.length, mixins = Array(_len), _key = 0; _key < _len; _key++) {
          mixins[_key] = arguments[_key];
        }

        mixins.reverse().forEach(function (mixinFn) {
          var mixin = mixinFn(_this);
          for (var key in mixin) {
            var currentFn = _this[key];
            _this[key] = mixin[key].call(_this, currentFn);
          }
        });
      }

      /******************
       * private function & async query
       ******************/
    }, {
      key: '__markLoading',
      value: function __markLoading(name, state) {
        var _this2 = this;

        if (typeof name != 'string') {
          name = JSON.stringify(name);
        }
        if (state == false) {
          var foundIndex = this.state.loading_state.indexOf(name);
          if (foundIndex > -1) {
            this.state.loading_state.splice(foundIndex, 1);
          }
        } else if (this.state.loading_state.indexOf(name) > -1) {
          state = false;
        } else {
          this.state.loading_state.push(name);
        }

        if (state) {
          var loadingDeps = this.__getLoadingStateDeps()[name];
          loadingDeps.forEach(loadingDeps, function (name) {
            _this2.state.loading_state.push(name);
          });
          this.trigger(this.state, true);
        }
      }
    }, {
      key: '__getLoadingStateDeps',
      value: function __getLoadingStateDeps() {
        return {};
      }
    }, {
      key: '__request',
      value: function __request(label, url, params) {
        var _this3 = this;

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
        /**
         * FIXME: need test
         */
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
          _this3.__markLoading(label, false);
          defer.resolve(response);
        }, function (error) {
          defer.reject(error);
        });

        return defer.promise;
      }
    }, {
      key: '__fromCached',
      value: function __fromCached(key) {
        var _this4 = this,
            _arguments = arguments;

        if (key) {
          key = JSON.stringify(key);
        }
        var chainOr;
        if (this.cached[key]) {
          chainOr = function () {
            var defer = _this4.$q.defer();
            defer.resolve(_this4.cached[key]);
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

},{}],4:[function(require,module,exports){
(function (global){
/**
 * Created by Phuc on 9/9/2015.
 */

'use strict';

var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);
var cssify = require('cssify');

cssify.byUrl('//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css');

var app = angular.module('ngTimeMachine', []);

app.directive('timeControls', require('./tm-controls'));
app.factory('tmStore', ['$q', require('./tm-store')]);
app.run([function () {}]);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./tm-controls":6,"./tm-store":7,"cssify":1}],5:[function(require,module,exports){
module.exports = '<style>\n  .in-frozen-mode {\n    background-color: #2574A9;\n    border-top: 1px solid #2574A9;\n  }\n\n  #tm-editor-instance {\n    height: 500px;\n  }\n</style>\n<nav class="navbar navbar-default navbar-fixed-bottom" ng-class="{\'navbar-inverse in-frozen-mode\': inFrozen}">\n  <div class="container">\n    <div class="navbar-brand" href="#">ngTimeMachine</div>\n    <div ng-if="inFrozen" class="navbar-brand" style="color: #fff;" href="#">In Frozen Time</div>\n    <p class="navbar-text">States <span class="badge">{{histories.length}}</span></p>\n    <button type="button" class="btn btn-info navbar-btn"\n            ng-click="openInjectEditor()"\n            title="Click to inject the register callback results">\n      Injectable Registers <span class="badge">{{injectableRegisters.length}}</span></button>\n\n    <div class="navbar-right">\n      <button type="button" ng-click="unFreeze()" ng-if="inFrozen" class="btn btn-danger">UnFreeze</button>\n      <button type="button" ng-click="frozenTime(timeline_index)" class="btn btn-success"\n              title="Click to frozen the next time you reload the browser">Frozen\n        Timeline <span class="badge">{{timeline_index + 1}}</span></button>\n      <button type="button" class="btn btn-default navbar-btn" ng-click="go(-1)"><i\n          class="fa fa-chevron-left"></i> Previous\n        <button type="button" class="btn btn-default navbar-btn" ng-click="go(1)">Next <i\n            class="fa fa-chevron-right"></i></button>\n      </button>\n    </div>\n  </div>\n</nav>\n\n<!-------- Inject register Editor ------------------>\n<div id="tm-inject-editor" class="modal fade" tabindex="-1" role="dialog">\n  <div class="modal-dialog modal-lg">\n    <div class="modal-content">\n      <div class="modal-header">\n        <h4>ngTimeMachine - Inject results to selected register\n          <div class="pull-right">\n            <button class="btn btn-sm btn-warning" ng-click="saveRegistersPermanent()"\n                    title="Save Injected results of registers permanently">Save Permanent\n            </button>\n            <button class="btn btn-sm btn-success" ng-click="applyInjectResult()">Apply Current Timeline\n            </button>\n          </div>\n        </h4>\n      </div>\n      <div class="modal-body">\n        <div class="row">\n          <div class="col-md-3">\n            <div class="list-group">\n              <button ng-repeat="item in injectableRegisters"\n                      ng-click="editRegisterResult($index)"\n                      type="button" class="list-group-item"\n                      ng-class="{active: item.selected}"\n                  >Register #{{item.storeIndex}}\n              </button>\n            </div>\n          </div>\n          <div class="col-md-9">\n            <div class="chosen-register">\n              <pre>{{chosenRegister.key}}</pre>\n            </div>\n            <div id="tm-editor-instance"></div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>';
},{}],6:[function(require,module,exports){
(function (global){
/**
 * Created by Phuc on 9/9/2015.
 */
'use strict';

!(function () {

  var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);
  var _isUndefined = angular.isUndefined;
  var _extend = angular.extend;
  var template = require('./templates/tm-controls.html');

  var Directive = function Directive($store) {

    var link = function link($scope, $element, $attr) {
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
        } else {
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
      };
    };

    /// directive declaration
    return {
      scope: {
        inFrozen: '@inFrozen',
        appName: '@appName'
      },
      link: link
    };
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
      } else {
        $store.execute();
      }
    });
  }

  module.exports = Directive;
}).call(undefined);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./templates/tm-controls.html":5}],7:[function(require,module,exports){
/**
 * Created by Phuc on 9/10/2015.
 */

'use strict';

module.exports = function ($q, $ajax) {

  var Store = {};
  var ClassStore = require('./class-store');
  var Signal = require('signals');

  Store.createClass = function (classDefs) {
    var ParentClass = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    var ParentKlass = ParentClass || ClassStore;
    var ChildKlass;
    var constructor = classDefs.constructor;
    if (constructor) {
      ChildKlass = constructor;
    } else {
      ChildKlass = function () {
        ParentKlass.apply(this, arguments);
      };
    }
    ChildKlass.prototype = Object.create(ParentKlass.prototype);

    angular.extend(ChildKlass.prototype, classDefs);

    ChildKlass.__super__ = ParentKlass.prototype;

    ChildKlass.createClass = ParentKlass.createClass;

    return ChildKlass;
  };

  Store.Define = function (actionNames, storeDefs) {
    var initialState = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    var ParentStore = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

    var Actions = {};
    actionNames.forEach(function (name) {
      Actions[name] = new Signal();
    });

    var NuStore = Store.createClass(storeDefs, ParentStore);

    return NuStore(Actions, $q, $ajax, initialState);
  };

  return Store;
};

},{"./class-store":3,"signals":2}]},{},[4])


//# sourceMappingURL=build.js.map