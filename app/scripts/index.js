'use strict'

angular.module('map', ['StarterApp']);
angular.module('mapsList', ['ngMaterial', 'ngDialog', 'angularFileUpload', 'StarterApp']);




var app = angular.module('StarterApp', ['ngMaterial', 'ngDialog', 'mapsList', 'ngRoute', 'map']);

app.constant('apiBase', (function() {
  return 'http://localhost:8080/PersonalTrack/rest';
})());

app.service('loginService', function($http, apiBase) {

    this.usrLogin = function(username, password) {
      var request = {};
      request.username = username;
      request.password = password;
      console.log('UsrLogin: ' + request.username);
      console.log('UsrPassword: ' + request.password);
      $http.post(apiBase + '/token/retrieve', JSON.stringify(request)).
          success(function(data, status, headers, config) {
          // this callback will be called asynchronously
          // when the response is available
          console.log(data);
      }).
      error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.

      });
    }
    this.usrLogout = function(){

    }
});

app.controller("AppCtrl", AppCtrl);

function AppCtrl($scope, $log, $http, $upload, apiBase, loginService){


      $http.get(apiBase + '/runner/runners').
  success(function(data, status, headers, config){
    $scope.users = data;
  });

    $scope.personalOptions = [
      {
        text: 'Your Maps',
        value: '/usermaps'
      },
      {
        text: 'Settings',
        value: 'settings'
      }
  ];

  $scope.login = function(){
    loginService.usrLogin($scope.loginusr, $scope.loginpwd);
  }

}




app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/maps', {
        templateUrl: 'partials/maps-list.html',
        controller: 'MapsListController'
      })
      .when('/map/:mapId', {
        templateUrl: 'partials/map.html',
        controller: 'MapController'
      }).
      otherwise({
        redirectTo: '/maps',
        controller: 'MapsListController'
      });
  }]);


