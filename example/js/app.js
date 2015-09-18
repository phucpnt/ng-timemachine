/**
 * Created by Phuc on 9/10/2015.
 */

!function () {
  var app = angular.module('todomvc', ['ngTimeMachine']);

  app.value('tmAppName', 'todomvc-tm');
  app.config(['tmStoreProvider', function (Store) {
    var TODO_COMPLETE = 1,
        TODO_UNCOMPLETED = 2;

    Store.initialState({
      todos: []
    });
    Store.defineActions([
      'todoCreate',
      'todoRemove',
      'todoComplete',
      'filter'
    ]);
    Store.defineStore({
      onTodoCreate: function (taskDesc) {
        this.state.todos.push({desc: taskDesc, status: TODO_UNCOMPLETED});
        this.trigger(this.state);
      }
    });

  }]);

  app.directive('directiveTodo', ['tmStore', function ($store) {

    function logDispatch() {
      return {
        dispatch: function (next) {
          var self = this;
          return function () {

            console.log('%cDispatch > ' + arguments[0] + ' > ', 'background:green;color:white;', Array.prototype.slice.call(arguments, 1));

            next.apply(self, arguments);
          }
        }
      };
    }

    $store.mixIn(logDispatch);

    return {
      templateUrl: 'directive-todo.html',
      link: function ($scope, $element) {

        $scope.addTodo = function () {
          $store.dispatch('todoCreate', $scope.newTodo);
        }

      }
    }
  }]);

  angular.bootstrap(document.getElementById('todoappmvc'), ['todomvc']);

}.call(this);
