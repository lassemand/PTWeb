'use strict'

var app = angular.module('StarterApp');

app.controller("MyEventCtrl", test);
app.controller("CreateCourseController", CourseController);

function test($scope, $timeout, $http, apiBase, loginService, $stateParams, dateConverter, $location, $mdDialog, EventService){
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

  if($scope.event.courses.length > 0){
  EventService.setEvent($scope.event);
  $location.path('eventdevice').search({eventId: $stateParams.eventId, type: 0});
  }
  else{
    $mdDialog.alert({
        title: 'Information',
        content: 'No courses have been attached',
        ok: 'Close'
      });
  }
}
$scope.changeToTeam = function(){
  $location.path('eventdevice').search({eventId: $stateParams.eventId, type: 1});
}
$scope.addCourse = function(){
 $mdDialog.show({
  templateUrl: 'createCourseDialog',
  controller: 'CreateCourseController',
}).then(function(course){
  if(course != null){
  course.event = $scope.event._id.$oid;
 $http({
  url: apiBase + '/course',
  method: 'POST',
  data: course,
  params: {owner: $scope.user._id.$oid}
}).
 success(function(data, status, headers, config) {
    course._id = data._id;
    $scope.event.courses.push(course);
 });
 }
});
}
}
function CourseController($scope, $mdDialog){

  $scope.cancel = function(){
    $mdDialog.hide();
  }
  $scope.submit = function(cname){
    var object = {name: cname};
    $mdDialog.hide(object);
  }
}

app.service('EventService', function () {
  var myEvent = null;
  var myFunctions = {
    setEvent : function(event){
      myEvent = event;
    },
    event : function(){
      return myEvent;
    }
  }
  return myFunctions;
});