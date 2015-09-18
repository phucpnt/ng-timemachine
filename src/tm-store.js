/**
 * Created by Phuc on 9/10/2015.
 */

var Store = {};
var ClassStore = require('./class-store');
var Signal = require('signals');
var instance = null;

Store.createClass = function (classDefs, ParentClass = null) {
  var ParentClass = ParentClass || ClassStore;
  var constructor = classDefs.constructor;

  function ChildClass() {
    if (classDefs.hasOwnProperty('constructor')) {
      constructor.apply(this, arguments);
    }
    else {
      ParentClass.apply(this, arguments);
    }
  }

  ChildClass.prototype = Object.create(ParentClass.prototype);
  ChildClass.prototype.constructor = ChildClass;

  angular.extend(ChildClass.prototype, classDefs);

  ChildClass.__super__ = ParentClass.prototype;

  ChildClass.createClass = ParentClass.createClass;

  console.log(ChildClass);


  return ChildClass;

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
