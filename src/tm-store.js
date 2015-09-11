/**
 * Created by Phuc on 9/10/2015.
 */

module.exports = function ($q, $ajax) {

  var Store = {};
  var ClassStore = require('./class-store');
  var Signal = require('signals');

  Store.createClass = function (storeDefs) {
    var NuStore;
    if (typeof storeDefs.constructor === 'function') {
      NuStore = storeDefs.constructor;
    }
    else {
      NuStore = function () {
        ClassStore.call(this);
      }
    }

    NuStore.prototype = Object.create(ClassStore.prototype);
    NuStore.prototype.constructor = NuStore;
    NuStore.prototype.__super__ = ClassStore;

    return NuStore;
  };

  Store.Define = function (actionNames, storeDefs, initialState = {}) {

    var Actions = {};
    actionNames.forEach((name) => {
      Actions[name] = new Signal;
    });

    var NuStore = Store.createClass(storeDefs);

    return NuStore(Actions, $q, $ajax, initialState)
  };


  return Store;
};
