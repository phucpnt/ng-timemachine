/**
 * Created by Phuc on 9/9/2015.
 */

var angular = require('angular');
var cssify = require('cssify');

cssify.byUrl('//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css');

var app = angular.module('ngTimeMachine', []);

app.directive('timeControls', require('./tm-controls'));
app.factory('tmStore', ['$q', require('./tm-store')]);
app.run([function () {

}]);

