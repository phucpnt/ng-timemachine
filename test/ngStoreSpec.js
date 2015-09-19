/**
 * Created by Phuc on 9/19/2015.
 */

'use strict';

describe('ngStore', () => {

  beforeEach(angular.mock.module('ngTimeMachine', function ($provide) {
    $provide.service('setupTimeControls', function () {
      return {
        start: jasmine.createSpy()
      }
    });
  }));

  var $q, $http, setupTimeControls;

  beforeEach(angular.mock.inject(function (_$q_, _$http_, _setupTimeControls_) {
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $q = _$q_;
    $http = _$http_;
    setupTimeControls = _setupTimeControls_;
    //var tmStore = require('../src/tm-store');
  }));

  it('should setup correctly', () => {
    expect(setupTimeControls.start).toHaveBeenCalled();
  });

});
