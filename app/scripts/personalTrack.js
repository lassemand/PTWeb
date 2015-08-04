'use strict'

var app = angular.module('StarterApp');

app.controller("PersonalTrackController", personalTrack);

function personalTrack($scope, $stateParams, $http, apiBase, $interval, $document, $element){
  var stop;
  $scope.eventdevices = {};
  $scope.showOverview = true;
  $scope.myMap = angular.element($document[0].querySelector('#map'))[0];
  $scope.myOverlay = angular.element($document[0].querySelector('#overlay'))[0];
  $scope.lastFetchedTime = new Date().getTime();
  $scope.$watch('myMap.clientWidth', function(value){
    var height = $scope.myMap.clientHeight;
    var width = value;
    $scope.myOverlay.style.height = height;
    $scope.myOverlay.style.width = width;
  });

  $scope.changeStatus = function(eventdevice){
    console.log(eventdevice);
  }

   $scope.calculateLatitude = function(latitude){
      var mapLat = $scope.map.latitude;
      var mapLong = $scope.map.longitude;
      var differenceLat = getDistanceFromLatLonInKm(mapLat, mapLong, latitude, mapLong);
      var convertedWithSize = differenceLat/$scope.map.size;
      var convertedWithCorrectDistance = (convertedWithSize / 2.54) * 100;
      return convertedWithCorrectDistance
   };

   $scope.calculateLongitude = function(longitude){
      var mapLat = $scope.map.latitude;
      var mapLong = $scope.map.longitude;
      var differenceLong = getDistanceFromLatLonInKm(mapLat, mapLong, mapLat, longitude);
      var convertedWithSize = differenceLong/$scope.map.size;
      var convertedWithCorrectDistance = (convertedWithSize / 2.54) * 100;
      return convertedWithCorrectDistance
   };



   function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
      var R = 6371.0072; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return d*100000;
    }

   function deg2rad(deg) {
      return deg * (Math.PI/180);
    }

   $http({
    url: apiBase + '/map',
    method: 'GET',
    params: {id: $stateParams.mapId}
   }).
   success(function(data, status, headers, config) {
      $scope.map = data;
  });

      function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

   $http({
    url: apiBase + '/event',
    method: 'GET',
    params: {id: $stateParams.eventId}
   }).
   success(function(data, status, headers, config) {
    data.eventdevices.forEach(function(value){
      value.visible = true;
      value.color = getRandomColor();
      $scope.eventdevices[value.device] = value; 
    });
  });

   $scope.startFetch = function(){
    if(angular.isDefined(stop)) return;
    stop = $interval(function(){
         $http({
    url: apiBase + '/eventdevice/eventUpdates',
    method: 'GET',
    params: {id: $stateParams.eventId, time: $scope.lastFetchedTime}
   }).
   success(function(data, status, headers, config) {
    data.eventdevices.forEach(function(value){
     var currentArray = $scope.eventdevices[value.device];
     if(currentArray.locations.length < value.locations.length){
        $scope.eventdevices[value.device].locations = value.locations;
     }
    });
  });
      $scope.lastFetchedTime = new Date().getTime();
    }, 1000);
   };

   $scope.stopFetch = function(){
    if(angular.isDefined(stop)){
      $interval.cancel(stop);
      stop = undefined;
    }
   };

   $scope.startFetch();
   $scope.$on('$destroy', function(){
    $scope.stopFetch();
   });
}