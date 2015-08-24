'use strict'

var app = angular.module('StarterApp');

app.controller("EventDeviceController", evtDeviceCtrl);



function evtDeviceCtrl($scope, $http, apiBase, loginService, $location, $stateParams, $mdDialog, EventService){

function initializeRunners(){
      var url = $scope.type == 0 ? apiBase + '/runner/runnersWithDefaultDeviceAttachedInPeriod' : apiBase + '/team/teamsById';
   var request = {
    url: url,
    method: 'GET',
    params: {start: $scope.event.start, end: $scope.event.end, event: $stateParams.eventId}
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
      console.log(data);
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

   $scope.user = loginService.user();
   $scope.type = $stateParams.type;
   $scope.count = 10;
   $scope.tablePage = 0;
   $scope.individualDevices = {};
   if(EventService.event() != null){
    $scope.event = EventService.event();
    initializeRunners();
   }
   else{
     $http({
  url: apiBase + '/event',
  method: 'GET',
  params: {id: $stateParams.eventId}
}).
 success(function(data, status, headers, config) {
  $scope.event = data;
  initializeRunners();
});
   }

   $scope.addEvent = function(id, runner){
    console.log($scope.myCourse);
    if($scope.type == 0){
      var myData = {device: id, event: $stateParams.eventId, runner: runner._id.$oid, course: $scope.myCourse._id};
      console.log(myData);
         var request = {
          url: apiBase + '/eventdevice',
          method: 'POST',
          params: {owner: $scope.user._id.$oid},
          data: myData
        };
        $http(request).
      success(function(data, status, headers, config) {
        runner.available = 2;
        myData._id = data._id;
        myData.runner = runner;
        $scope.myCourse.eventdevices.push(myData);
    });
    }
   }
   $scope.removeEvent = function(myRunner, index){
    var courseId = null;
    var eventDeviceId = null;
    console.log($scope.event.courses.length);
     for(var a = 0; a<$scope.event.courses.length && courseId == null; a++){
      var course = $scope.event.courses[a];
      for(var b = 0; b<course.eventdevices.length && courseId == null; b++){
        var runner = course.eventdevices[b].runner._id.$oid;
        if(runner === myRunner._id.$oid){
          courseId = $scope.event.courses[a]._id;
          eventDeviceId = course.eventdevices[b]._id;
          course.eventdevices.splice(b, 1);
        }
      }
     }
    var course = $scope.myCourse;
    var object = {owner: $scope.user._id.$oid, id: eventDeviceId, event: $stateParams.eventId, course: courseId};
    if($scope.type == 0 && courseId != null){
         var request = {
          url: apiBase + '/eventdevice',
          method: 'DELETE',
          params: object
        };
        $http(request).
      success(function(data, status, headers, config) {
        $scope.content[index].available = 1;
      });
    }
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

}