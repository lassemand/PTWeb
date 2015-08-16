'use strict'

var app = angular.module('StarterApp');

app.controller("HistoryTrackController", HistoryTrackController);
app.controller("HistoryTrackSpeedDialogController", HistoryTrackSpeedDialogController);


function HistoryTrackController($scope, $http, $window, apiBase, $stateParams, apiMapsBase, $mdDialog, $interval, $rootScope){
        var sidenav = document.getElementById('sidenav');
        var sidenavbutton = document.getElementById('sidenavbutton');
        var savedSideNavDisplay = sidenav.style.display;
        var savedSideNavButtonDisplay = sidenavbutton.style.display;
        sidenav.style.display = 'none';
        sidenavbutton.style.display = 'none';
        var timeline = document.getElementsByClassName("playlineline"); 
        var playlinetime = document.getElementsByClassName("playlinetime")[0]; 
        var constantAddition = 60000;
        var aktualLength = undefined;
        var definedStart = undefined;
        var stop = null;
        $scope.size = 20;
        $scope.playing = true;
        $scope.timeChange = false;
        var speedOptions = [1,3,5,7,10, 20, 50, 100];
        $scope.choosenSpeed = 5;

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

$http({
    url: apiBase + '/event',
    method: 'GET',
    params: {id: $stateParams.eventId}
   }).
   success(function(data, status, headers, config) {
      aktualLength = (data.end - data.start) + constantAddition;
      definedStart = data.start - constantAddition;
      $scope.currentTime = data.start - constantAddition;
      $scope.play();
      
      for (var property in data.eventdevices) {
      var value = data.eventdevices[property];
      insertIndexOnEventDevice(value);
      }
      $scope.event = data;
      console.log(data);
  });

   $scope.incrementSpeed = function(){
    var currentIndex = speedOptions.indexOf($scope.choosenSpeed);
    if(currentIndex != speedOptions.length - 1)
      $scope.choosenSpeed = speedOptions[currentIndex + 1];
      showChoosenSpeed();
   }

  $scope.decrementSpeed = function(){
    var currentIndex = speedOptions.indexOf($scope.choosenSpeed);
    if(currentIndex != 0)
      $scope.choosenSpeed = speedOptions[currentIndex - 1];
      showChoosenSpeed();
   }

   function showChoosenSpeed(){
        var instance =  $mdDialog.show({
        templateUrl: 'trackHistorySpeedDialog',
        controller: 'HistoryTrackSpeedDialogController',
        locals : {
          speed : $scope.choosenSpeed
        }
      });
   } 

   function insertIndexOnEventDevice(eventdevice){
    var a = 0;
    while($scope.currentTime < eventdevice.locations[a] && a<eventdevice.locations.length) a++;
    a == 0 ? eventdevice.index = a : eventdevice.index = a - 1;
   }

   $scope.changeTime = function(){
    console.log('changeTime');
    $scope.timeChange = true;
   }
   $scope.stopTime = function(){
    console.log('stopTime');
    $scope.timeChange = false;
   }
   $scope.moveTime = function(){
    if($scope.timeChange){
      console.log('moveTime');
    }
   }

   function updateIndexOnEventDevice(eventdevice){
    console.log(eventdevice);
    if(eventdevice.index < eventdevice.locations.length - 1 && eventdevice.locations[eventdevice.index + 1].modified < $scope.currentTime) eventdevice.index++;
   }

   $scope.play = function(){
    var fetchFrequence = 100;
    $scope.playing = true;
         stop = $interval(function(){
          $scope.currentTime += fetchFrequence * $scope.choosenSpeed;
          $scope.retrieveCurrentTimeLine();
          for (var property in $scope.event.eventdevices) {
            var value = $scope.event.eventdevices[property];
            updateIndexOnEventDevice(value);
            insertMarker(value);
          }
        }, fetchFrequence);
   }
   $scope.pause = function(){
    $scope.playing = false;
    $scope.stopFetch();
   }

    function insertMarker(eventdevice){
      var length = eventdevice.locations.length;
      if(length > 0){
        var location = eventdevice.locations[eventdevice.index];
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
        var eventDeviceObject = {marker: marker, color: pinColor};
        eventdevice.markerObject = eventDeviceObject;
      }
    }

   $scope.retrieveCurrentTimeLine = function(){
      var percentage = 1 - (aktualLength-($scope.currentTime - definedStart))/aktualLength;
      if(percentage >= 1){
        percentage = 1;
        $scope.pause();
      }
      //20 is the size of the time indicater
      var width = timeline[0].offsetWidth - 20;

      var marginLeft = width * percentage;
      playlinetime.style.marginLeft = marginLeft + 'px';
   }

   $window.onresize = function(){
    $scope.retrieveCurrentTimeLine();
  }

   $scope.convertPlayingToString = function(){
    var currentTime = ($scope.currentTime - $scope.event.start) / 1000;
    var minutes = ((currentTime / 60) | 0);
    var seconds = ((currentTime % 60) | 0);
    if(minutes < 0) minutes = minutes * -1;
    if(seconds < 0) seconds = seconds * -1;
    if(minutes.toString().length == 1) minutes = "0" + minutes;
    if(seconds.toString().length == 1) seconds = "0" + seconds;
    if(currentTime >= 0)
    return minutes + ':' + seconds;
    else
    return '-' + minutes + ':' + seconds;
   }

   $scope.stopFetch = function(){
    if(angular.isDefined(stop)){
      $interval.cancel(stop);
      stop = undefined;
    }
   }

   $scope.$on('$destroy', function(){
    $scope.stopFetch();
    $rootScope.hideDrawer = false;
    sidenav.style.display = savedSideNavDisplay;
    sidenavbutton.style.display = savedSideNavButtonDisplay;
   });

}

function HistoryTrackSpeedDialogController($scope, $mdDialog, $interval, speed){
  var a = 0;
  $scope.choosenSpeed = speed;
     var stop = $interval(function(){
          if(a<50){
            a++;
          }
          else{
            $mdDialog.cancel();
            $interval.cancel(stop);
            stop = undefined;
          }
        }, 10);
    $scope.calculateTransparent = function(){
      return 1-(a/50);
    }
}

