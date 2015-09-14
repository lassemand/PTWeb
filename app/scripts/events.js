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
        console.log(data);
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
      console.log(event);
      $location.path('event/'+ event._id.$oid);
    }
}

function crtEvtCtrl($scope, $http, apiBase, loginService, $mdDatePicker, $location, $window, $mdDialog, dateConverter){
  $('#startSelector').datepicker({minDate: new Date(), dateFormat: 'dd MM yy', onSelect: function(dateText){
    $('#endSelector').datepicker("option", "minDate", new Date(dateText));
    $(this).change();
  }});
  $('#endSelector').datepicker({minDate: new Date(), dateFormat: 'dd MM yy'});
  $('#startdatehour').clockpicker({donetext: 'Done'});
  $('#enddatehour').clockpicker({donetext: 'Done'});
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
    $scope.convertLong = function(longDate){
      return dateConverter.convertLong(longDate);
    }
    $scope.dateFormat = function(mydate){
      return dateConverter.dateFormat(mydate);
    }
    $scope.chooseMap = function(map){  
      $scope.choosenMap = map;
    }
    $scope.onChange = function(date){
      if(date.getTime()<new Date().getTime()) console.log('Before');
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
          var startTime = $scope.startDateHour.split(":");
          var endTime = $scope.endDateHour.split(":");
          var aktualStartTime = new Date(new Date($scope.startDate).getTime() + startTime[0] * 3600000 + startTime[1] * 60000).getTime();
          var aktualEndTime = new Date(new Date($scope.endDate).getTime() + endTime[0] * 3600000 + endTime[1] * 60000).getTime();
          var myEvent = {name: $scope.eventname, map: map._id.$oid, start: aktualStartTime, end: aktualEndTime, owner: $scope.user._id.$oid};
        $http({
            url: apiBase + '/event',
            method: 'POST',
            data: myEvent
      }).success(function(data, status, headers, config) {
        $window.history.back();
      });
        }
      }
    $scope.submitFirst = function(name, start, end, startdatehour, enddatehour){

      $scope.nextPage();
    }
}