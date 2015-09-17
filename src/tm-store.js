/**
 * Created by Phuc on 9/10/2015.
 */

var Store = {};
var ClassStore = require('./class-store');
var Signal = require('signals');
var instance = null;

Store.createClass = function (classDefs, ParentClass = null) {
  var ParentKlass = ParentClass || ClassStore;
  var constructor = classDefs.constructor;

  function ChildKlass() {
    if (constructor) {
      constructor.apply(this, arguments);
    }
    else {
      ParentKlass.apply(this, arguments);
    }
  }

  console.log(ParentKlass);
  console.log(ParentKlass.prototype);
  console.log(Object.create(ParentKlass.prototype));
  ChildKlass.prototype = Object.create(ParentKlass.prototype);
  ChildKlass.prototype.constructor = ChildKlass

  angular.extend(ChildKlass.prototype, classDefs);

  ChildKlass.__super__ = ParentKlass.prototype;

  ChildKlass.createClass = ParentKlass.createClass;

  return ChildKlass;

};

Store.define = function (storeDefs, initialState = {}) {
  return Store.createClass(storeDefs);
};

Store.makeActions = function (actionNames) {
  var Actions = {};
  actionNames.forEach((name) => {
    Actions[name] = new Signal;
  });
};

Store.getInstance = function () {
  return instance;
};


module.exports = Store;
