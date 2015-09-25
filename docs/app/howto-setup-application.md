# How to setup application

The setup is straight forward and should be defined inside the `app.config`

```javascript

  app.config(['tmStoreProvider', function (Store) {
    // put your setup here...

    // define the actions
    // define initialstate
    // define store

  });

```

### Define actions

Base on the APP functionality, we define the actions which would update store data/state.
Of course there are other action that would *NOT* related to update store data, these action should stay inside the
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



