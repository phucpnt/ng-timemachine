/**
 * Created by Phuc on 9/10/2015.
 */

!function () {
  var app = angular.module('todomvc', ['ngTimeMachine']);

  app.value('tmAppName', 'todomvc-tm');
  app.config(['tmStoreProvider', function (Store) {

    Store.initialState({
      tasks: [],
      filter: 'all',
      currentTaskId: 0
    });
    Store.defineActions([
      'todoCreate',
      'todoRemove',
      'todoComplete',
      'filter'
    ]);
    Store.defineStore({
      onTodoCreate: function (taskDesc) {
        this.state.currentTaskId++;
        this.state.tasks.push({desc: taskDesc, completed: false, taskId: this.state.currentTaskId});
        return this.trigger(this.state);
      },
      onTodoComplete: function (taskId, completed) {
        var foundTask = this.state.tasks.filter(function (item) {
          return item.taskId === taskId;
        })[0];
        console.log(foundTask);
        if (foundTask) {
          foundTask.completed = completed;
        }

        return this.trigger(this.state);
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

        $store.register($scope, {tasks: 'tasks', filter: 'filter'}, function (state) {
          return {
            tasks: state.tasks,
            filter: state.filter
          };
        });

        $scope.todoAdd = function () {
          $store.dispatch('todoCreate', $scope.newTodo);
        };

        $scope.todoCompleted = function (task) {
          $store.dispatch('todoComplete', task.taskId, task.completed);
        };

      }
    }
  }]);

  angular.bootstrap(document.getElementById('todoappmvc'), ['todomvc']);

}.call(this);
