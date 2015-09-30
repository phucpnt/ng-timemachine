/**
 * Created by Phuc on 9/19/2015.
 */

'use strict';

var FocusStore = require('../src/ng-store-focus');

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


  describe('ngStore', () => {
    var Store, Actions, instance;
    beforeEach(() => {
      Store = require('../src/utility-store');
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

      class StoreClass extends FocusStore {

        onFoo(val){
          this.state.field1 = val;
          this.trigger(this.state);
        }
        onBar(val){
          this.state.field2.field21 = val;
          this.trigger(this.state);
        }
      }

      instance = new StoreClass(Actions, $q, $http, {
        field1: 1,
        field2: {
          field21: 10
        },
        field3: {
          field31: {
            field32: 100
          }
        }
      });

    });

    it('create instance correctly', () => {

      var $scope1 = $scope.$new(true);

      instance.register($scope1, ['field1'], function(field1){
        return {field1: field1};
      });
      expect($scope1.field1).toEqual(1);

      instance.dispatch('foo', 2);
      expect($scope1.field1).toEqual(2);


    });

    it('only trigger $scope which focus on field', () => {

      var $scope1 = $scope.$new(true);
      var $scope2 = $scope.$new(true);

      instance.register($scope1, ['field1'], function(field1){
        return {field1: field1};
      });

      var spyUpdateScopeAttr  = jasmine.createSpy('update.scope2.attr');
      instance.register($scope2, ['field2'], spyUpdateScopeAttr);

      expect($scope1.field1).toEqual(1);
      expect(spyUpdateScopeAttr).toHaveBeenCalled();

      instance.dispatch('foo', 2);
      expect(spyUpdateScopeAttr.calls.count()).toEqual(1);

      instance.dispatch('bar', 11);
      expect(spyUpdateScopeAttr.calls.count()).toEqual(2);
      expect(spyUpdateScopeAttr).toHaveBeenCalledWith({field21: 11});
    });

    it('should support trigger $scope on focus field with nested path', () => {
      var $scope2 = $scope.$new(true);

      var spyUpdateScopeAttr  = jasmine.createSpy('update.scope2.attr');
      instance.register($scope2, ['field2/field21'], spyUpdateScopeAttr);

      expect(spyUpdateScopeAttr).toHaveBeenCalledWith(10);

      instance.dispatch('bar', 11);
      expect(spyUpdateScopeAttr).toHaveBeenCalledWith(11);

    });

  })

});
