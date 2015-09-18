/**
 * Created by Phuc on 9/10/2015.
 */

!function () {
  var app = angular.module('todomvc', ['ngTimeMachine']);

  app.value('tmAppName', 'todomvc-tm');
  app.config(['tmStoreProvider', function (Store) {
    Store.initialState({});
    Store.defineActions([
      'todoCreate',
      'todoRemove',
      'todoComplete',
      'filter'
    ]);
    Store.defineStore({
      onTodoCreate: function (taskDesc) {

      }
    });

  }]);

  app.directive('directiveTodo', ['tmStore', function($store){



  }]);

  angular.bootstrap(document.getElementById('todoappmvc'), ['todomvc']);

}.call(this);
