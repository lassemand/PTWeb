'use strict'

var app = angular.module('map');

app.controller("MapController", mapCtrl);

function mapCtrl($scope, $timeout, $routeParams, $http, apiBase){

      $http.get(apiBase + '/map?id=' + $routeParams.mapId).
  success(function(data, status, headers, config) {
      $scope.map = data;
          $scope.modifiedMap = function () {
        return new Date($scope.map.modified*1000).format('j F Y');
      };
  }).
  error(function(data, status, headers, config) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
  });
}

