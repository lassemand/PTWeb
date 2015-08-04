'use strict'

var app = angular.module('StarterApp');

app.controller("EventDeviceController", evtDeviceCtrl);


function evtDeviceCtrl($scope, $http, apiBase, loginService, $location, $stateParams){
   $scope.user = loginService.user();
   $scope.type = $stateParams.type;
   $scope.count = 10;
   $scope.tablePage = 0;
   $scope.initialLoaded = false;
   $http({
          url: apiBase + '/event',
          method: 'GET',
          params: {id: $stateParams.eventId}
        }).
   success(function(data, status, headers, config){
    $scope.event = data;
    $scope.initialLoaded = true;
   });
   $scope.addEvent = function(id, runnerId){
    if($scope.type == 0){
         var request = {
          url: apiBase + '/eventdevice',
          method: 'POST',
          params: {owner: $scope.user._id.$oid},
          data: {device: id, event: $stateParams.eventId, runner: runnerId}
        };
        $http(request).
      success(function(data, status, headers, config) {
        $scope.event.eventdevices.push({modified: new Date().getTime()/1000, locations: [], device: id});
    });
    }
   }
   $scope.removeEvent = function(id, index){
    if($scope.type == 0){
         var request = {
          url: apiBase + '/eventdevice',
          method: 'DELETE',
          params: {owner: $scope.user._id.$oid, device: id, event: $stateParams.eventId}
        };
        $http(request).
      success(function(data, status, headers, config) {
        for(var a = 0; a<$scope.event.eventdevices.length;a++){
          if($scope.event.eventdevices[a].device === id){
            $scope.event.eventdevices.splice(a, 1);
            break;
          }
        }
    });
   }
    }
   $scope.checkForContained = function(runner){
    if(runner.defaultdevice == null) return 0;
    var startIndex = $scope.tablePage * $scope.count;
    var endIndex = $scope.tablePage * $scope.count + $scope.count;
    for(var a = startIndex; a<endIndex && a<$scope.event.eventdevices.length; a++){
      var device = $scope.event.eventdevices[a].device;
      console.log('defaultdevice: ' + runner.defaultdevice + ' device: ' + device + ' Same: ' + (runner.defaultdevice === device));
      if(runner.defaultdevice === device) return 2;
    }
    return 1;
   }
   $scope.noDefaultDevice = function(){
    console.log('No default device attached');
   }

    var url = $scope.type == 0 ? apiBase + '/runner/runners' : apiBase + '/team/teamsById';
   var request = {
    url: url,
    method: 'GET'
   };
   if($scope.type == 1){
    request.params = {id: JSON.stringify($scope.user.team)};
    $scope.searchHint = "Search for team";
   }
   else if($scope.type == 0){
    $scope.searchHint = "Search for runner";
   }
    $http(request).
   success(function(data, status, headers, config) {
      $scope.content = data;
        $scope.nbOfPages = function () {
        return Math.ceil(data.length / $scope.count);
      }
  });

}