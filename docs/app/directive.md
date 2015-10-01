Directive - separation between business logic (data flow) and presentation
==================

### A basic setup of directive.

```javascript
app.directive('SimpleDirective', ['tmStore', function(store){

  return {
    // directive declarations...

    link: function($scope, $element, $attr){

      store.register($scope, {resultField1: scopeField1}, [$scope.data..., function selector(state, data...){
        // cooking data from the state and provided data from the $scope.
        return {
          resultField1: value1,
        };
      }]);

      expect($scope.scopeField1).toEqual(value1);

      $scope.onSelectA = function(valA){
        // delegate the logic event to the store
        store.dispatch('selectA', valA);
      };

      // dispatch more event to update the data of the store ...

    }

  };

}]);
```

**Alternative forms of `store.register`**

```javascript

// result returned from the selector function would auto map into the $scope.scopefield
store.register($scope, 'scopefield', [data..., function selector(state, data...){}]);

```

```javascript

// call the defined store function which named 'filterABC'
store.register($scope, 'scopefield', [data..., 'filterABC']);

```

----------------

### Basic requirements:

* 1 `Directive` have 1 `register` to receive data updated from the store.
* `Directive` can dispatch many events to the `Store` to update the data by starting unit updates or flow of
 multiple updates in the Store.
* Things related to presentation like: animation, stylist etc... would stay in the directive.

### Why follow that structure?

* Should it be simple if the directive only getting the data from the store. Whatever they do with the data would _not
effect data inside the store_.

* When passing data to AngularJS `$scope` to produce some presentation (ngRepeat, display value etc), if data is an object
you would see the extra field `$hashKey` has been probably appended into the object. Imagine you need to store the whole data
as the json encoded string, the extra `$hashKey` could be trash field for your database.

* It reduce the complexity of data passing inside the whole application: Different Directives can use the same object to
produce different presentation, accidentally they could mess-up shared data because of the **pointer** passing in JS.
The more directives the more mess could create for the data.

* Directive focus on how to present the data, rather than dealing with business logic of the data.



