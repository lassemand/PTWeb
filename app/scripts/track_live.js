'use strict'



var app = angular.module('StarterApp');

app.controller("LiveTrackController", LiveTrackController);

  var numDeltas = 100;

    function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
    }

    function preInitiate(name){
              var mapOptions = {
          center: { lat: -34.397, lng: 150.644},
          zoom: 8
        };
        var map = new google.maps.Map(document.getElementById(name),
            mapOptions);
        return map;
    }

    function initiateGoogleMaps(url, mapId, map){
        var kmlUrl = url + '/' + mapId + '/doc.kml';
        //var kmlUrl = 'https://www.dropbox.com/s/ua9a9a74xayb5fs/westcampus.kml?raw=1';
        var kmlOptions = {
        suppressInfoWindows: true,
        preserveViewport: false,
        map: map
        };
        return new google.maps.KmlLayer(kmlUrl, kmlOptions);
    }

    function insertMarker(latitude, longitude, name, map){
        var myLatLng = {lat: latitude, lng: longitude};
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
          map: map,
          title: name
        });
        marker.setMap(map);
        return marker;
    }

function LiveTrackController($scope, $http, $window, apiBase, $stateParams, apiMapsBase, $interval){
var stop;
$scope.showOverview = true;
$scope.marker = {};

    var map = preInitiate('map-canvas2');
    var kmlLayer = initiateGoogleMaps(apiMapsBase, $stateParams.mapId);

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
      var eventDeviceObject = insertMarker(value, map);
      $scope.marker[value.device] = eventDeviceObject;
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

app.controller("HistoryTrackController", HistoryTrackController);
app.controller("HistoryTrackSpeedDialogController", HistoryTrackSpeedDialogController);


function HistoryTrackController($scope, $http, $window, apiBase, $stateParams, apiMapsBase, $mdDialog, $interval, $rootScope){
        var sidenav = document.getElementById('sidenav');
        var sidenavbutton = document.getElementById('sidenavbutton');
        var timelineoverlay = document.getElementById("playlineoverlay");  
        var savedSideNavDisplay = sidenav.style.display;
        var savedSideNavButtonDisplay = sidenavbutton.style.display;
        sidenav.style.display = 'none';
        sidenavbutton.style.display = 'none';
        var timeline = document.getElementsByClassName("playlineline")[0]; 
        var playlinetime = $('#playlinetime');
        var canvasObject = $('#body');
        var constantAddition = 60000;
        var aktualLength = undefined;
        var definedStart = undefined;
        var stop = null;
        $scope.size = 20;
        $scope.playing = true;
        $scope.timeChange = false;
        var speedOptions = [1,3,5,7,10,20,50,100];
        var timeLineMargin = 1;
        var buttonSize = 16;
        $scope.choosenSpeed = 5;
        var map = preInitiate('map-canvas');
        var kmlLayer = initiateGoogleMaps(apiMapsBase, $stateParams.mapId, map);
        var myCourses = {};
        var savedMarkers = {};
    function transition(from, to, marker){
        var latlng = new google.maps.LatLng(to.latitude, to.longitude);
        marker.setPosition(latlng);

    }

$http({
    url: apiBase + '/event/eventWithLocations',
    method: 'GET',
    params: {id: $stateParams.eventId}
   }).
   success(function(data, status, headers, config) {
    var allEventDevices = [];
      aktualLength = (data.end - data.start) + constantAddition;
      definedStart = data.start - constantAddition;
      $scope.currentTime = data.start - constantAddition;
      $scope.play();
      for(var a = 0; a<data.courses.length; a++){
        var course = data.courses[a];
        var myEventDevices = {};
        for(var b = 0; b<course.eventdevices.length; b++){
          var eventdevice = course.eventdevices[b];
          myEventDevices[eventdevice._id] = eventdevice;
          allEventDevices.push(eventdevice._id);
        }
        myCourses[course._id] = myEventDevices;
      }
      $scope.event = data;
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
    //Should be binary
    var a = 0;
    console.log($scope.currentTime);
    console.log(eventdevice.location.locations);
    while($scope.currentTime > eventdevice.location.locations[a].modified && a<eventdevice.location.locations.length) {
      console.log('Are we here');
      a++;
    }
    eventdevice.index = a - 1;
   }

   var startPosition = null;
   var startWidth = null;
   var isPlaying = false;

   function mouseMove(e){
    var currentPosition = e.pageX;
    var aktualDifference = currentPosition - startPosition;
    var currentWidth = startWidth + aktualDifference;
    var percent = null;
    if(currentWidth <= (buttonSize/2)){
      currentWidth = (buttonSize/2);
    }
    else if(currentWidth > timeline.offsetWidth - ((buttonSize/2) - timeLineMargin)){
      percent = 1;
      currentWidth = timeline.offsetWidth - ((buttonSize/2) + timeLineMargin);
    }
    else{
      percent = currentWidth / (timeline.offsetWidth-(timeLineMargin * 2)-(buttonSize/2));
    }
      timelineoverlay.style.width = currentWidth;
      $scope.currentTime = ($scope.event.start - constantAddition) + (percent * aktualLength);
   }

   function mouseUp(e){
    canvasObject.unbind('mousemove', mouseMove);
    canvasObject.unbind('mouseup', mouseUp);
    if(isPlaying) $scope.play();
   }

    function changeTime(e){
    startPosition = e.pageX;
    startWidth = timelineoverlay.offsetWidth;
    isPlaying = $scope.playing;
    if(isPlaying) $scope.stopFetch();
    canvasObject.bind('mousemove', mouseMove);
    canvasObject.bind('mouseup', mouseUp);
   }

    playlinetime.bind('mousedown', changeTime);

   function updateIndexOnEventDevice(eventdevice){
    var tempIndex = eventdevice.index;
        while(eventdevice.location.locations[tempIndex+1] != null && eventdevice.location.locations[tempIndex + 1].modified < $scope.currentTime) tempIndex++;
        while(eventdevice.location.locations[tempIndex] != null && eventdevice.location.locations[tempIndex].modified > $scope.currentTime) tempIndex--;
      eventdevice.index = tempIndex;
   }
   $scope.play = function(){
    var fetchFrequence = 100;
    $scope.playing = true;
         stop = $interval(function(){
          $scope.currentTime += fetchFrequence * $scope.choosenSpeed;
          $scope.retrieveCurrentTimeLine();
          if($scope.choosenCourse != null){
          var selectedCourse = myCourses[$scope.choosenCourse._id];
          for (var property in selectedCourse) {
            var eventDevice = selectedCourse[property];
            updateIndexOnEventDevice(eventDevice);
          }
        }
        }, fetchFrequence);
   }
   $scope.pause = function(){
    $scope.playing = false;
    $scope.stopFetch();
   }

   $scope.retrieveCurrentTimeLine = function(){
      var declaredStart = $scope.event.start - constantAddition;   
      if($scope.currentTime < $scope.event.end){     
      var marginLeft = (($scope.currentTime - declaredStart) / ($scope.event.end - declaredStart)) * (timeline.offsetWidth - ((timeline * 2) + (buttonSize / 2)));
      timelineoverlay.style.width = marginLeft + 'px';
      }
      else{
        $scope.pause();
      }
   }

   $window.onresize = function(){
    $scope.retrieveCurrentTimeLine();
  }

  function removeMarkers(){
          for (var property in savedMarkers) {
            var value = savedMarkers[property];
            console.log(value);
            if(value != null){
              value.setMap(null);
            }
          }
          savedMarkers = {};
  }

  $scope.$watch('choosenCourse', function () {
      removeMarkers();
       if($scope.choosenCourse != null){
          var eventdevices = myCourses[$scope.choosenCourse._id];
          var first = true;
          for (var property in eventdevices) {
            var value = eventdevices[property];
            if(value.location != null && value.location.locations.length > 0){
              insertIndexOnEventDevice(value);
              console.log(value.index);
              if(value.index != -1){
              var position = value.location.locations[value.index];
              var myMarker = insertMarker(position.latitude, position.longitude, value.runner.name, map);
            if(first){
              map.panTo(myMarker.getPosition());
              first = false;
            }
              savedMarkers[value._id] = myMarker;
              }
            }
          }
       }
  });

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


