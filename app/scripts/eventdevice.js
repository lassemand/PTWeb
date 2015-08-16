'use strict'

var app = angular.module('StarterApp');

app.controller("EventDeviceController", evtDeviceCtrl);


function evtDeviceCtrl($scope, $http, apiBase, loginService, $location, $stateParams, $mdDialog){
   $scope.user = loginService.user();
   $scope.type = $stateParams.type;
   $scope.count = 10;
   $scope.tablePage = 0;
   $scope.initialLoaded = false;
   $scope.individualDevices = {};

   $http({
          url: apiBase + '/event',
          method: 'GET',
          params: {id: $stateParams.eventId}
        }).
   success(function(data, status, headers, config){
    $scope.event = data;
    $scope.initialLoaded = true;
   });
   $scope.addEvent = function(id, runner){
    console.log(runner);
    if($scope.type == 0){
      var myData = {device: id, event: $stateParams.eventId, runner: runner._id.$oid};
         var request = {
          url: apiBase + '/eventdevice',
          method: 'POST',
          params: {owner: $scope.user._id.$oid},
          data: myData
        };
        $http(request).
      success(function(data, status, headers, config) {
        $scope.event.eventdevices[runner._id.$oid] = {modified: new Date().getTime(), locations: [], device: id, runner: runner};
    });
    }
   }
   $scope.removeEvent = function(id, index){
    if($scope.type == 0){
         var request = {
          url: apiBase + '/eventdevice',
          method: 'DELETE',
          params: {owner: $scope.user._id.$oid, runner: id, event: $stateParams.eventId}
        };
        $http(request).
      success(function(data, status, headers, config) {
        $scope.event.eventdevices[id] = null;
    });
   }
    }
   $scope.checkForContained = function(runner){
    if(runner.defaultdevice == null) return 0;
    if(!runner.available) return 3;
    var startIndex = $scope.tablePage * $scope.count;
    var endIndex = $scope.tablePage * $scope.count + $scope.count;
      var evtRunner = $scope.event.eventdevices[runner._id.$oid];
      if(evtRunner != null) return 2;
    return 1;
   }

   $scope.defaultDeviceMissing = function(){
          var alert = $mdDialog.alert()
        .title('Missing device')
        .content('This runner does not have a default device attached and can therefore not be added to an event.')
        .ok('Close');
          $mdDialog
          .show( alert )
          .finally(function() {
            alert = undefined;
          });
   }

      $scope.defaultDeviceObtained = function(){
          var alert = $mdDialog.alert()
        .title('Default device obtained')
        .content('This runners default device is obtained in this period, try another device, or ask him to remove device from the other event.')
        .ok('Close');
          $mdDialog
          .show( alert )
          .finally(function() {
            alert = undefined;
          });
   }

    var url = $scope.type == 0 ? apiBase + '/runner/runnersWithDefaultDeviceAttachedInPeriod' : apiBase + '/team/teamsById';
   var request = {
    url: url,
    method: 'GET',
    params: {start: 1438552802, end: 1438639199}
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
      data.forEach(function(response){
        
        if(response.defaultdevice != null){
        $http({
          url: apiBase + '/device/devicesFromRunner',
          method: 'GET',
          params: {id: response._id.$oid}
        }).
        success(function(data, status, headers, config) {
          $scope.individualDevices[response._id.$oid] = data;
        });
      }
      });
  });

}