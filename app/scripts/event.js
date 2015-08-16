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
    $scope.eventTimeComparedToAktuelTime = function(){
      var currentDate = new Date().getTime();
      if(currentDate < $scope.event.start) return 0;
      else if(currentDate >= $scope.event.start && currentDate < $scope.event.end) return 1;
      else return 2; 
    };
  });
       $scope.convertLong = function(longDate){
      return dateConverter.convertLong(longDate);
    }
    $scope.dateFormat = function(mydate){
      return dateConverter.dateFormat(mydate);
    }
      $scope.changeToMap = function(){
      $location.path('track_live').search({eventId: $stateParams.eventId, mapId: $scope.event.map._id.$oid});
    }

    $scope.changeToHistory = function(){
      $location.path('track_history').search({eventId: $stateParams.eventId, mapId: $scope.event.map._id.$oid});
    }

      $scope.changeToRunner = function(){
      $location.path('eventdevice').search({eventId: $stateParams.eventId, type: 0});
    }
    $scope.changeToTeam = function(){
      $location.path('eventdevice').search({eventId: $stateParams.eventId, type: 1});
    }

}