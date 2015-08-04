'use strict'

var app = angular.module('StarterApp');

app.controller("EventsController", evtCtrl);
app.controller("EventCreateController", crtEvtCtrl);

function evtCtrl($scope, $http, apiBase, loginService, $location){
   $scope.user = loginService.user();
      $http({
            url: apiBase + '/event/eventsFromRunner',
            method: 'GET',
            params: {id: $scope.user._id.$oid}
      }).success(function(data, status, headers, config) {
        $scope.events = data;
      });
    $scope.headers = [
     {
        name: 'Name'
      },{
        name: 'Start'
      },{
        name: 'End'
      }
    ];

    $scope.dateConvert = function(dateLong){
      return new Date(dateLong).format('j F Y');
    }
    $scope.createEvent = function(){
      $location.path('events/create');
    }
    $scope.showEvent = function(event){
      $location.path('event/'+ event._id.$oid);
    }
}

function crtEvtCtrl($scope, $http, apiBase, loginService, $mdDatePicker, $location, $window, $mdDialog, dateConverter){
    $scope.user = loginService.user();
        $scope.headers = [
     {
        name: 'Name', 
        field: 'name'
      },{
        name:'Size', 
        field: 'size'
      },{
        name: 'Last Modified', 
        field: 'modified'
      }
    ];
    $http({
            url: apiBase + '/map/maps',
            method: 'GET',
            params: {id: JSON.stringify($scope.user.maps)}
      }).success(function(data, status, headers, config) {
        $scope.maps = data;
      });
  $scope.pagenumber = 0;
  $scope.maxnumber = 1;
  $scope.nextPage = function(){
    if($scope.maxnumber != $scope.pagenumber)
    $scope.pagenumber++;
  }
  $scope.previousPage = function(){
    if($scope.pagenumber != 0)
    $scope.pagenumber--;
  }
  $scope.cancel = function(){
    $window.history.back();
  }
  $scope.showStartPicker = function(ev) {
      $mdDatePicker(ev, $scope.currentDate).then(function(selectedDate) {
        $scope.startDate = $scope.dateFormat(selectedDate);
      });;
    }  
  $scope.showEndPicker = function(ev) {
      $mdDatePicker(ev, $scope.startDate).then(function(selectedDate) {
        $scope.endDate = $scope.dateFormat(selectedDate);
      });;
    }  
    $scope.convertLong = function(longDate){
      return dateConverter.convertLong(longDate);
    }
    $scope.dateFormat = function(mydate){
      return dateConverter.dateFormat(mydate);
    }
    $scope.chooseMap = function(map){  
      $scope.choosenMap = map;
    }
    $scope.submitEvent = function(map){
      if(map == null){
        var alert = $mdDialog.alert()
        .title('Missing information')
        .content('No map have been choosen')
        .ok('Close');

      $mdDialog
          .show( alert )
          .finally(function() {
            alert = undefined;
          });
      }
      else{
          var myEvent = {name: $scope.eventname, map: map._id.$oid, start: (new Date($scope.startDate).getTime()/1000), end: (new Date($scope.endDate).getTime()/1000), owner: $scope.user._id.$oid};
        $http({
            url: apiBase + '/event',
            method: 'POST',
            data: myEvent
      }).success(function(data, status, headers, config) {
        $window.history.back();
      });
        }
      }
    $scope.submitFirst = function(name, start, end){
      $scope.nextPage();
    }
}