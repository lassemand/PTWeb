'use strict'

var app = angular.module('StarterApp');

app.controller("MyEventCtrl", test);

function test($scope, $timeout, $http, apiBase, loginService, $stateParams, dateConverter, $location){
   $scope.user = loginService.user();
   $http({
    url: apiBase + '/event',
    method: 'GET',
    params: {id: $stateParams.eventId}
   }).
   success(function(data, status, headers, config) {
      console.log(data);
      $scope.event = data;
  });
       $scope.convertLong = function(longDate){
      return dateConverter.convertLong(longDate);
    }
    $scope.dateFormat = function(mydate){
      return dateConverter.dateFormat(mydate);
    }
      $scope.changeToMap = function(){
      if($scope.event != null)
      $location.path('personalTrack').search({eventId: $stateParams.eventId, mapId: $scope.event.map._id.$oid});
    }
      $scope.changeToRunner = function(){
      $location.path('eventdevice').search({eventId: $stateParams.eventId, type: 0});
    }
    $scope.changeToTeam = function(){
      console.log('changeToTeam');
      $location.path('eventdevice').search({eventId: $stateParams.eventId, type: 1});
    }
}