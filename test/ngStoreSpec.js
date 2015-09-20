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

  var $q, $http, setupTimeControls;

  beforeEach(angular.mock.inject((_$q_, _$http_, _setupTimeControls_) => {
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $q = _$q_;
    $http = _$http_;
    setupTimeControls = _setupTimeControls_;
    //var tmStore = require('../src/tm-store');
  }));

  it('should setup correctly', () => {
    expect(setupTimeControls.start).toHaveBeenCalled();
  });

  describe('ngStore provider in angular', () => {
    var Store;
    beforeEach(() => {
      Store = require('../src/tm-store');
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
    var Actions, StoreClass;
    var Store;
    beforeEach(() => {
      Store = require('../src/tm-store');
    });

    beforeEach(() => {

      Actions = Store.makeActions(['foo', 'bar', 'baz', 'qux']);
      StoreClass = Store.define({
        onFoo: function () {
        },

        onBar: function () {
        },

        onBaz: function () {
        }
      });
    });

    it('create instance correctly', () => {
      var instance = new StoreClass(Actions, $q, $http);
      expect(instance.onFoo).toBeDefined();
      expect(instance.onBar).toBeDefined();
      expect(instance.onBaz).toBeDefined();
    });

  })

});
