'use strict'



var app = angular.module('StarterApp');

app.controller("LiveTrackController", LiveTrackController);


function LiveTrackController($scope, $http, $window, apiBase, $stateParams, apiMapsBase, $interval){
var stop;
$scope.showOverview = true;
$scope.marker = {};
var numDeltas = 100;

        var mapOptions = {
          center: { lat: -34.397, lng: 150.644},
          zoom: 8
        };
        var map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
            var kmlUrl = apiMapsBase + '/' + $stateParams.mapId + '/doc.kml';
        //var kmlUrl = 'https://www.dropbox.com/s/ua9a9a74xayb5fs/westcampus.kml?raw=1';
        var kmlOptions = {
        suppressInfoWindows: true,
        preserveViewport: false,
        map: map
        };
        var kmlLayer = new google.maps.KmlLayer(kmlUrl, kmlOptions);

    function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
    }

    function insertMarker(eventdevice){
      var length = eventdevice.locations.length;
      if(length > 0){
        var location = eventdevice.locations[length - 1];
        var myLatLng = {lat: location.latitude, lng: location.longitude};
    var pinColor = getRandomColor();
    var pinImage = {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
       fillColor: pinColor,
       fillOpacity: 0.9,
    scale: 1,
    strokeColor: pinColor
    };
        var marker = new google.maps.Marker({
          position: myLatLng,
          icon:pinImage,
          map: map,
          title: eventdevice.runner.name
        });
        var eventDeviceObject = {marker: marker, position: [location.latitude, location.longitude], 
          eventdevice: eventdevice, color: pinColor};
        $scope.marker[eventdevice.device] = eventDeviceObject;
      }
    }

    function updateMarker(locations, device){
      if($scope.marker[device] != null){
        var deviceLocation = locations[locations.length-1];
        var marker = $scope.marker[device];
        var result = [deviceLocation.latitude, deviceLocation.longitude];
        transition(result, marker);
      }
    }

    function transition(result, marker){
      var i = 0;
      var deltaLat = (result[0] - marker.position[0])/numDeltas;
      var deltaLng = (result[1] - marker.position[1])/numDeltas;
      var transitionStop = $interval(function(){
        marker.position[0] += deltaLat;
        marker.position[1] += deltaLng;
        var latlng = new google.maps.LatLng(marker.position[0], marker.position[1]);
        marker.marker.setPosition(latlng);
        if(i != numDeltas)
        i++;
        else
          $interval.cancel(transitionStop);
      }, 10);
    }

   $http({
    url: apiBase + '/event',
    method: 'GET',
    params: {id: $stateParams.eventId}
   }).
   success(function(data, status, headers, config) {
    for (var property in data.eventdevices) {
      var value = data.eventdevices[property];
      insertMarker(value);
    }
    $scope.eventdevices = data.eventdevices;
  });

    $scope.changeVisibilityOfMarker = function(device){
      var aktualMarker = $scope.marker[device];
      var visible = aktualMarker.marker.visible;
      if(visible){
        aktualMarker.marker.setMap(map);
      }
      else aktualMarker.marker.setMap(null);
    }

   $scope.startFetch = function(){
    if(angular.isDefined(stop)) return;
    stop = $interval(function(){
         $http({
    url: apiBase + '/eventdevice/eventUpdates',
    method: 'GET',
    params: {id: $stateParams.eventId, time: $scope.lastFetchedTime}
   }).
   success(function(data, status, headers, config) {
    for (var property in data.eventdevices) {
      if (data.eventdevices.hasOwnProperty(property)) {
        var value = data.eventdevices[property];
        var currentArray = $scope.eventdevices[property];
        if(currentArray.locations.length < value.locations.length){
        $scope.eventdevices[property].locations = value.locations;
        updateMarker(value.locations, value.device);
        }
      }
    }
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

