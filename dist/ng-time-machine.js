(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
;(function(win){
	var store = {},
		doc = win.document,
		localStorageName = 'localStorage',
		scriptTag = 'script',
		storage

	store.disabled = false
	store.version = '1.3.17'
	store.set = function(key, value) {}
	store.get = function(key, defaultVal) {}
	store.has = function(key) { return store.get(key) !== undefined }
	store.remove = function(key) {}
	store.clear = function() {}
	store.transact = function(key, defaultVal, transactionFn) {
		if (transactionFn == null) {
			transactionFn = defaultVal
			defaultVal = null
		}
		if (defaultVal == null) {
			defaultVal = {}
		}
		var val = store.get(key, defaultVal)
		transactionFn(val)
		store.set(key, val)
	}
	store.getAll = function() {}
	store.forEach = function() {}

	store.serialize = function(value) {
		return JSON.stringify(value)
	}
	store.deserialize = function(value) {
		if (typeof value != 'string') { return undefined }
		try { return JSON.parse(value) }
		catch(e) { return value || undefined }
	}

	// Functions to encapsulate questionable FireFox 3.6.13 behavior
	// when about.config::dom.storage.enabled === false
	// See https://github.com/marcuswestin/store.js/issues#issue/13
	function isLocalStorageNameSupported() {
		try { return (localStorageName in win && win[localStorageName]) }
		catch(err) { return false }
	}

	if (isLocalStorageNameSupported()) {
		storage = win[localStorageName]
		store.set = function(key, val) {
			if (val === undefined) { return store.remove(key) }
			storage.setItem(key, store.serialize(val))
			return val
		}
		store.get = function(key, defaultVal) {
			var val = store.deserialize(storage.getItem(key))
			return (val === undefined ? defaultVal : val)
		}
		store.remove = function(key) { storage.removeItem(key) }
		store.clear = function() { storage.clear() }
		store.getAll = function() {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = function(callback) {
			for (var i=0; i<storage.length; i++) {
				var key = storage.key(i)
				callback(key, store.get(key))
			}
		}
	} else if (doc.documentElement.addBehavior) {
		var storageOwner,
			storageContainer
		// Since #userData storage applies only to specific paths, we need to
		// somehow link our data to a specific path.  We choose /favicon.ico
		// as a pretty safe option, since all browsers already make a request to
		// this URL anyway and being a 404 will not hurt us here.  We wrap an
		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
		// since the iframe access rules appear to allow direct access and
		// manipulation of the document element, even for a 404 page.  This
		// document can be used instead of the current document (which would
		// have been limited to the current path) to perform #userData storage.
		try {
			storageContainer = new ActiveXObject('htmlfile')
			storageContainer.open()
			storageContainer.write('<'+scriptTag+'>document.w=window</'+scriptTag+'><iframe src="/favicon.ico"></iframe>')
			storageContainer.close()
			storageOwner = storageContainer.w.frames[0].document
			storage = storageOwner.createElement('div')
		} catch(e) {
			// somehow ActiveXObject instantiation failed (perhaps some special
			// security settings or otherwse), fall back to per-path storage
			storage = doc.createElement('div')
			storageOwner = doc.body
		}
		var withIEStorage = function(storeFunction) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0)
				args.unshift(storage)
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				storageOwner.appendChild(storage)
				storage.addBehavior('#default#userData')
				storage.load(localStorageName)
				var result = storeFunction.apply(store, args)
				storageOwner.removeChild(storage)
				return result
			}
		}

		// In IE7, keys cannot start with a digit or contain certain chars.
		// See https://github.com/marcuswestin/store.js/issues/40
		// See https://github.com/marcuswestin/store.js/issues/83
		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
		function ieKeyFix(key) {
			return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
		}
		store.set = withIEStorage(function(storage, key, val) {
			key = ieKeyFix(key)
			if (val === undefined) { return store.remove(key) }
			storage.setAttribute(key, store.serialize(val))
			storage.save(localStorageName)
			return val
		})
		store.get = withIEStorage(function(storage, key, defaultVal) {
			key = ieKeyFix(key)
			var val = store.deserialize(storage.getAttribute(key))
			return (val === undefined ? defaultVal : val)
		})
		store.remove = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			storage.removeAttribute(key)
			storage.save(localStorageName)
		})
		store.clear = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes
			storage.load(localStorageName)
			for (var i=0, attr; attr=attributes[i]; i++) {
				storage.removeAttribute(attr.name)
			}
			storage.save(localStorageName)
		})
		store.getAll = function(storage) {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = withIEStorage(function(storage, callback) {
			var attributes = storage.XMLDocument.documentElement.attributes
			for (var i=0, attr; attr=attributes[i]; ++i) {
				callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
			}
		})
	}

	try {
		var testKey = '__storejs__'
		store.set(testKey, testKey)
		if (store.get(testKey) != testKey) { store.disabled = true }
		store.remove(testKey)
	} catch(e) {
		store.disabled = true
	}
	store.enabled = !store.disabled

	if (typeof module != 'undefined' && module.exports && this.module !== module) { module.exports = store }
	else if (typeof define === 'function' && define.amd) { define(store) }
	else { win.store = store }

})(Function('return this')());

},{}],3:[function(require,module,exports){
/**
 * Created by Phuc on 9/30/2015.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var BSKeyHistories = '__time_machine_histories';
exports.BSKeyHistories = BSKeyHistories;
var BSKeyIsfrozen = '__time_machine_frozen';
exports.BSKeyIsfrozen = BSKeyIsfrozen;

},{}],4:[function(require,module,exports){
(function (global){
/**
 * Created by Phuc on 9/28/2015.
 */

'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _const = require('./_const');

var $const = _interopRequireWildcard(_const);

var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);
var Storage = require('store');
var Store = require('./tm-store');

module.exports = function (StoreProvider) {
  var _extend = angular.extend;
  var app = angular.module('ngTimeMachine', []);

  app.value('tmAppName', '__need_your_app_name_override__');

  /**
   * refactor this: flexible Store class usage
   */
  app.provider('tmStore', StoreProvider);

  app.directive('timeControls', ['tmStore', require('./tm-controls')]);
  app.service('setupTimeControls', ['tmAppName', '$compile', '$rootElement', '$rootScope', 'tmStore', function (appName, $compile, $rootElement, $rootScope, $store) {
    return {
      start: function start() {
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
        } else {
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./_const":3,"./tm-controls":9,"./tm-store":10,"store":2}],5:[function(require,module,exports){
/**
 * Created by Phuc on 9/9/2015.
 */

'use strict';

var StoreProvider = require('./ng-store-provider');
var Store = require('./ng-store');

require('./_index.js')(StoreProvider(Store));

},{"./_index.js":4,"./ng-store":7,"./ng-store-provider":6}],6:[function(require,module,exports){
/**
 * Created by Phuc on 9/10/2015.
 */

'use strict';

module.exports = function (StoreClassConcrete) {

  var defineStoreClass = require('./tm-store');
  var Store = defineStoreClass(StoreClassConcrete);

  return function tmStore() {

    var Actions = null;
    var StoreClass = null;
    var initialState = {};

    this.defineStore = function (storeDefs) {
      StoreClass = Store.createClass(storeDefs);
    };
    this.defineActions = function (actions) {
      Actions = Store.makeActions(actions);
    };
    this.initialState = function (state) {
      initialState = state;
    };

    this.$get = ['$q', '$http', '$timeout', function storeFactory($q, $http, $timeout) {
      var storeInstance = new StoreClass(Actions, $q, $http, initialState);

      storeInstance.mixIn(function makeSureScopeDigestWillBeTrigger() {
        return {
          trigger: function trigger(next) {
            var _this = this;

            return function (state) {
              $timeout(function () {
                next.call(_this, state);
              });
            };
          }
        };
      });

      return storeInstance;
    }];
  };
};

},{"./tm-store":10}],7:[function(require,module,exports){
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
      key: '__makeSelector',
      value: function __makeSelector($scope, scopeAttrMap, handleDef) {
        return { $scope: $scope, attrMap: scopeAttrMap, handleDef: handleDef };
      }
    }, {
      key: '__register',
      value: function __register(selector, skipFirstTime) {
        var index = this.selectors.length;
        this.selectors.push(selector);

        // free memory
        selector.$scope.$on('$destroy', (function (index, store) {
          return function () {
            store.selectors.slice(index, 1);
          };
        })(index, this));

        if (!skipFirstTime) {
          this.__execSelectorHandler(selector);
        }
      }
    }, {
      key: 'register',
      value: function register($scope, scopeAttrMap, handleDef, skipFirstTime) {
        return this.__register(this.__makeSelector($scope, scopeAttrMap, handleDef), skipFirstTime);
      }
    }, {
      key: '__execSelectorHandler',
      value: function __execSelectorHandler(selector) {
        var state = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        if (state == null) {
          state = this.state;
        }

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
          fnArgs.unshift(angular.extend({}, state));
          if (typeof fn === 'string') {
            result = this[fn].apply(this, fnArgs);
          } else {
            result = fn.apply(null, fnArgs);
          }
        }

        if (angular.isString(attrMap)) {
          selector.$scope[attrMap] = angular.copy(result);
        } else if (angular.isObject(attrMap)) {
          _forEach(attrMap, function (scopeAttr, resultAttr) {
            $scope[scopeAttr] = angular.copy(result[resultAttr]);
          });
        } else {
          _forEach(result, function (value, attr) {
            $scope[attr] = angular.copy(value);
          });
        }

        return true;
      }
    }, {
      key: '__getSelectors',
      value: function __getSelectors() {
        return this.selectors;
      }
    }, {
      key: 'trigger',
      value: function trigger(state, force) {
        //console.log('%c >> trigger delay in flow', 'background: yellow', this.__trigger_depth);
        if (!force && this.__trigger_depth) {
          return;
        }

        var selectors = this.__getSelectors();
        for (var i = 0; i < selectors.length; i++) {
          var selector = selectors[i];
          this.__execSelectorHandler(selector, state);
        }

        return true;
      }
    }, {
      key: 'flowStart',
      value: function flowStart(promise) {
        this.__trigger_depth = this.__trigger_depth ? this.__trigger_depth + 1 : 1;
        console.log('%c >> flow start', 'background: yellow', this.__trigger_depth);

        if (promise && typeof promise.then === 'function') {
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
          _forEach(loadingDeps, function (name) {
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

},{}],8:[function(require,module,exports){
module.exports = '<style>\n  .in-frozen-mode {\n    background-color: #2574A9;\n    border-top: 1px solid #2574A9;\n  }\n\n  #tm-editor-instance {\n    height: 500px;\n  }\n</style>\n<nav class="navbar navbar-default navbar-fixed-bottom" ng-class="{\'navbar-inverse in-frozen-mode\': inFrozen}">\n  <div class="container">\n    <div class="navbar-brand" href="#">ngTimeMachine</div>\n    <div ng-if="inFrozen" class="navbar-brand" style="color: #fff;" href="#">In Frozen Time</div>\n    <p class="navbar-text">States <span class="badge">{{histories.length}}</span></p>\n    <button type="button" class="btn btn-info navbar-btn"\n            ng-click="openInjectEditor()"\n            title="Click to inject the register callback results">\n      Injectable Registers <span class="badge">{{injectableRegisters.length}}</span></button>\n\n    <div class="navbar-right">\n      <button type="button" ng-click="unFreeze()" ng-if="inFrozen" class="btn btn-danger">UnFreeze</button>\n      <button type="button" ng-click="frozenTime(timeline_index)" class="btn btn-success"\n              title="Click to frozen the next time you reload the browser">Frozen\n        Timeline <span class="badge">{{timeline_index + 1}}</span></button>\n      <button type="button" class="btn btn-default navbar-btn" ng-click="go(-1)"><i\n          class="glyphicon glyphicon-chevron-left"></i> Previous\n        <button type="button" class="btn btn-default navbar-btn" ng-click="go(1)">Next <i\n            class="glyphicon glyphicon-chevron-right"></i></button>\n      </button>\n    </div>\n  </div>\n</nav>\n\n<!-------- Inject register Editor ------------------>\n<div id="tm-inject-editor" class="modal fade" tabindex="-1" role="dialog">\n  <div class="modal-dialog modal-lg">\n    <div class="modal-content">\n      <div class="modal-header">\n        <h4>ngTimeMachine - Inject results to selected register\n          <div class="pull-right">\n            <button class="btn btn-sm btn-warning" ng-click="saveRegistersPermanent()"\n                    title="Save Injected results of registers permanently">Save Permanent\n            </button>\n            <button class="btn btn-sm btn-success" ng-click="applyInjectResult()">Apply Current Timeline\n            </button>\n          </div>\n        </h4>\n      </div>\n      <div class="modal-body">\n        <div class="row">\n          <div class="col-md-3">\n            <div class="list-group">\n              <button ng-repeat="item in injectableRegisters"\n                      ng-click="editRegisterResult($index)"\n                      type="button" class="list-group-item"\n                      ng-class="{active: item.selected}"\n                  >Register #{{item.storeIndex}}\n              </button>\n            </div>\n          </div>\n          <div class="col-md-9">\n            <div class="chosen-register">\n              <pre>{{chosenRegister.key}}</pre>\n            </div>\n            <div id="tm-editor-instance"></div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>';
},{}],9:[function(require,module,exports){
(function (global){
/**
 * Created by Phuc on 9/9/2015.
 */
'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _const = require('./_const');

var $const = _interopRequireWildcard(_const);

var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);
var _isUndefined = angular.isUndefined;
var _extend = angular.extend;
var _clone = angular.copy;
var template = require('./templates/tm-controls.html');

var Directive = function Directive($store) {

  var link = function link($scope, $element, $attr) {
    var appName = $scope.appName || '';

    function getStorageKey(key) {
      return appName + '.' + key;
    }

    $scope.histories = $store.getPersistStorage().get(getStorageKey($const.BSKeyHistories)) || [];
    $store.register($scope, 'timeline_index', function (state) {
      var index;
      if (_isUndefined(state.__time_machine)) {
        var cState = _clone(state);
        index = cState.__time_machine = $scope.histories.length;
        $scope.histories.push(cState);
      } else {
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
      Storage.set(getStorageKey($const.BSKeyIsfrozen), timelineIndex);
      Storage.set(getStorageKey($const.BSKeyHistories), $scope.histories);
      window.location.reload();
    };

    $scope.unFreeze = function () {
      var Storage = $store.getPersistStorage();
      Storage.remove(getStorageKey($const.BSKeyIsfrozen));
      Storage.remove(getStorageKey($const.BSKeyHistories));
      window.location.reload();
    };
  };

  /// directive declaration
  return {
    scope: {
      inFrozen: '@inFrozen',
      appName: '@appName'
    },
    template: template,
    link: link
  };
};

module.exports = Directive;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./_const":3,"./templates/tm-controls.html":8}],10:[function(require,module,exports){
/**
 * Created by Phuc on 9/10/2015.
 */

'use strict';

var Signal = require('signals');

module.exports = function (ClassStore) {
  var Store = {};
  Store.createClass = function (classDefs) {
    var ParentClass = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    var ParentClass = ParentClass || ClassStore;
    var constructor = classDefs.constructor;

    function ChildClass() {
      if (classDefs.hasOwnProperty('constructor')) {
        constructor.apply(this, arguments);
      } else {
        ParentClass.apply(this, arguments);
      }
    }

    ChildClass.prototype = Object.create(ParentClass.prototype);
    ChildClass.prototype.constructor = ChildClass;

    angular.extend(ChildClass.prototype, classDefs);

    ChildClass.__super__ = ParentClass.prototype;

    ChildClass.createClass = Store.createClass;

    return ChildClass;
  };

  Store.define = function (storeDefs) {
    var initialState = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    return Store.createClass(storeDefs);
  };

  Store.makeActions = function (actionNames) {
    var Actions = {};
    actionNames.forEach(function (name) {
      Actions[name] = new Signal();
    });
    return Actions;
  };

  return Store;
};

},{"signals":1}]},{},[5])


//# sourceMappingURL=ng-time-machine.js.map