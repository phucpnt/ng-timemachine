/**
 * Created by Phuc on 9/10/2015.
 */

module.exports = function (Store) {
  return function tmStore() {

    var Actions = null;
    var StoreClass = null;
    var initialState = {};

    this.defineStore = function (storeDefs) {
      StoreClass = Store.createClass(storeDefs)
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
          trigger: function (next) {
            return (state) => {
              $timeout(() => {
                next.call(this, state);
              });
            };
          }
        };
      });

      return storeInstance;
    }]

  };
};
