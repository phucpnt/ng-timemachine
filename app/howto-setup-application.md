# How to setup application


### In the html of the page

Include the script is straight forward

```html
<!doctype html>
<html lang="en" data-framework="angularjs">
<head>
<!-- page header -->
</head>
<body>

<!-- your page content with angular directive & controllers etc... -->

<script src="angular.js"></script>
<script src="ng-timemachine.js"></script>
<script src="application.js"></script>
</body>
```


### The angular APP

Using TimeMachine is simple as the angular module declaration. You create your application with dependency `ngTimeMachine`.
The store setup should be defined inside the `app.config`

```javascript

  var app = angular.module('your-awesome-app', ['ngTimeMachine']);

  app.value('tmAppName', 'your-awesome-app'); // used for time machine to remember the state after browser refresh
  app.config(['tmStoreProvider', function (Store) {
    // put your setup here...

    // define the actions
    // define initialstate
    // define store

  });

```

### Define actions

Base on the APP functionality, we define the actions which would update store data/state.
Of course there are other actions that would *NOT* related to update store data, these action should stay inside the
directive. ex: animation, ui transition etc...

```javascript

  Store.defineActions([
    'todoCreate',
    'todoRemove',
    'todoComplete',
    'todoUpdate',
    'batchUpdate',
    'filter'
  ]);

```


### Define initial state

There is a begin state for your app. That is what the APP look like when first load without any user interactions

```javascript

  Store.initialState({
    tasks: [],
    filter: 'all',
    currentTaskId: 0
  });

```


### Store implementation - business logic & data flow in app

For every actions defined, the store should provide the handle function for each one. For convention, each store handle
function should be prefix with `on` then the action name ex: `onTodoCreate`

```javascript

  Store.defineStore({
    onTodoCreate: function (taskDesc) {
      this.state.currentTaskId++;
      this.state.tasks.push({desc: taskDesc, completed: false, taskId: this.state.currentTaskId});
      return this.trigger(this.state);
    }
    ...
    ...
  });

```



