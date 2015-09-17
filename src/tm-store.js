/**
 * Created by Phuc on 9/10/2015.
 */

module.exports = function ($q, $ajax) {

  var Store = {};
  var ClassStore = require('./class-store');
  var Signal = require('signals');

  Store.createClass = function (classDefs, ParentClass = null) {
    var ParentKlass = ParentClass || ClassStore;
    var ChildKlass;
    var constructor = classDefs.constructor;
    if (constructor) {
      ChildKlass = constructor;
    }
    else {
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

  Store.Define = function (actionNames, storeDefs, initialState = {}, ParentStore = null) {

    var Actions = {};
    actionNames.forEach((name) => {
      Actions[name] = new Signal;
    });

    var NuStore = Store.createClass(storeDefs, ParentStore);

    return NuStore(Actions, $q, $ajax, initialState)
  };


  return Store;
};
