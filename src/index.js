/**
 * Created by Phuc on 9/9/2015.
 */

var angular = require('angular');

var app = angular.module('ngTimeMachine', []);

app.directive('timeControls', function () {

});
app.factory('tmStore', ['$q', require('./tm-store')]);
app.run([function () {

}]);

