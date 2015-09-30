/**
 * Created by Phuc on 9/19/2015.
 */

'use strict';

describe('ngTimeMachine module', () => {

  beforeEach(angular.mock.module('ngTimeMachine', ($provide) => {
    $provide.service('setupTimeControls', function () {
      return {
        start: jasmine.createSpy()
      }
    });
  }));

  var $q, $http, $scope, $timeout, $httpBackend, setupTimeControls;

  beforeEach(angular.mock.inject((_$q_, _$http_, _setupTimeControls_, _$rootScope_, _$timeout_, _$httpBackend_) => {
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $q = _$q_;
    $http = _$http_;
    $scope = _$rootScope_;
    $timeout = _$timeout_;
    $httpBackend = _$httpBackend_;
    setupTimeControls = _setupTimeControls_;
    //var tmStore = require('../src/tm-store');
  }));

  it('should setup correctly', () => {
    expect(setupTimeControls.start).toHaveBeenCalled();
  });

  describe('ngStore provider in angular', () => {
    var Store;
    beforeEach(() => {
      Store = require('../src/utility-store');
    });

    it('support create Actions', () => {

      var Actions = Store.makeActions(['a1', 'a2', 'a3']);

      expect(Object.keys(Actions).length).toEqual(3);

    });

    it('support create new Store Class', () => {

      var StoreClass = Store.define({});

      expect(StoreClass).toBeDefined();
      expect(StoreClass.createClass).toBeDefined();

    })

  });

  describe('ngStore', () => {
    var Store, Actions, StoreClass;
    beforeEach(() => {
      Store = require('../src/tm-store');
    });

    beforeEach(() => {

      Actions = Store.makeActions([
        'foo',
        'bar',
        'baz',
        'qux',
        'selectA',
        'selectB',
        'combineSelectAB',
        'asyncRequest'
      ]);
      /**
       * TODO:
       * 1) unit test for async request
       * 2) unit test for loading state on request
       */
      StoreClass = Store.define({
        onFoo: jasmine.createSpy(function () {
          this.trigger(this.state);
        }),

        onBar: function () {
          this.trigger(this.state);
        },

        onBaz: function () {
          this.trigger(this.state);
        },

        onSelectA: function () {
          this.state.selectA = true;
          this.trigger(this.state);
        },
        onSelectB: function () {
          this.state.selectB = true;
          this.trigger(this.state);
        },

        onCombineSelectAB: function () {
          return this.flowStart()
              .then(() => {
                return this.onSelectA();
              })
              .then(() => {
                return this.onSelectB();
              })
              .then(() => {
                this.flowEnd(this.state);
              });
        },

        onAsyncRequest: function () {
          return this
              .flowStart(this.__request('should_show_loading', '/server-api'))
              .then(() => {
                this.state.server_result = 'loaded';
              })
              .then(() => {
                this.flowEnd(this.state);
              });
        }

      });
    });

    it('create instance correctly', () => {
      var instance = new StoreClass(Actions, $q, $http);
      expect(instance.onFoo).toBeDefined();
      expect(instance.onBar).toBeDefined();
      expect(instance.onBaz).toBeDefined();
    });

    it('allow $scope register', () => {
      var storeInstance = new StoreClass(Actions, $q, $http);
      var selector = jasmine.createSpy();
      storeInstance.register($scope, 'result', selector);
      expect(selector).toHaveBeenCalled();
    });

    it('dispatch request correctly', () => {
      var storeInstance = new StoreClass(Actions, $q, $http);
      storeInstance.dispatch('foo', 1, 2, 3);
      expect(storeInstance.onFoo).toHaveBeenCalled();
      expect(storeInstance.onFoo).toHaveBeenCalledWith(1, 2, 3);

    });

    it('update the $scope correctly when state change', () => {
      var i = 0;
      var storeInstance = new StoreClass(Actions, $q, $http);
      storeInstance.register($scope, 'result', function (state) {
        return ++i;
      });
      expect($scope.result).toEqual(1);

      storeInstance.dispatch('bar', 1, 2, 3);
      expect($scope.result).toEqual(2);
    });

    it('allow assign multiple fields on $scope register', () => {
      var i = 0;
      var storeInstance = new StoreClass(Actions, $q, $http);
      storeInstance.register($scope, {resultField1: 'scopeField1', resultField2: 'scopeField2'}, function (state) {
        return {
          resultField1: ++i,
          resultField2: true
        };
      });

      expect($scope.scopeField1).toEqual(1);
      expect($scope.scopeField2).toEqual(true);
    });

    it('allow combine actions and trigger store change only once', (done) => {

      var storeInstance = new StoreClass(Actions, $q, $http);
      storeInstance.register($scope, {selectA: 'selectA', selectB: 'selectB'}, function (state) {
        return {
          selectA: state.selectA,
          selectB: state.selectB
        };
      });

      storeInstance.dispatch('combineSelectAB');

      $timeout(() => {
        expect($scope.selectA).toBe(true);
        expect($scope.selectB).toBe(true);
        done()
      }, 10);
      $timeout.flush();

    });

    it('support ajax with loading state', () => {
      var storeInstance = new StoreClass(Actions, $q, $http);
      storeInstance.register($scope, {
        should_show_loading: 'should_show_loading',
        server_result: 'server_result'
      }, function (state) {
        return {
          should_show_loading: state.loading_state.indexOf('should_show_loading') > -1,
          server_result: state.server_result
        };
      });

      $httpBackend.when('JSONP', '/server-api').respond({status: 'ok'});

      $httpBackend.expectJSONP('/server-api');
      storeInstance.dispatch('asyncRequest');

      $timeout(() => {
        expect($scope.should_show_loading).toBe(true);
      }, 1);
      $timeout.flush();

      $httpBackend.flush();

      $timeout(() => {
        expect($scope.server_result).toEqual('loaded');
      }, 1);
      $timeout.flush();


    });


  })

});
