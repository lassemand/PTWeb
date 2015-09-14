'use strict'

var app = angular.module('StarterApp');

app.controller("LiveTrackController", LiveTrackController);
app.controller("HistoryTrackController", HistoryTrackController);
app.controller("HistoryTrackSpeedDialogController", HistoryTrackSpeedDialogController);

  var numDeltas = 100;
  var map;
  var savedMarkers = {};
  var myCourses = {};
  var sidenav = null;
  var sidenavbutton = null;
  var savedSideNavDisplay = null;
  var savedSideNavButtonDisplay = null;

    function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
    }

  function insertIndexOnEventDevice(eventdevice, currentTime){
    //Should be binary
    var a = 0;
    while(a<eventdevice.location.locations.length && currentTime > eventdevice.location.locations[a].modified) {
      a++;
    }
    eventdevice.index = a - 1;
   }

   function courseChoosen(course, currentTime){
    removeMarkers();
       if(course != null){
          var eventdevices = myCourses[course._id];
          var first = true;
          for (var property in eventdevices) {
            var value = eventdevices[property];
            value.visible = true;
            if(value.location != null && value.location.locations.length > 0){
              insertIndexOnEventDevice(value, currentTime);
              if(value.index != -1){
              var position = value.location.locations[value.index];
              var myMarker = insertMarker(position.latitude, position.longitude, value.runner.name, map, value.visible, value.color);
                if(first){
                  map.panTo(myMarker.getPosition());
                  first = false;
                }
              }
              savedMarkers[value._id] = myMarker;
            }
          }
       }
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

      function removeMarkers(){
          for (var property in savedMarkers) {
            var value = savedMarkers[property];
            if(value != null){
              value.setMap(null);
            }
          }
          savedMarkers = {};
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

    function insertMarker(latitude, longitude, name, map, visible, pinColor){
        var myLatLng = {lat: latitude, lng: longitude};
    var pinImage = {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
       fillColor: pinColor,
       fillOpacity: 0.9,
    scale: 1,
    strokeColor: pinColor,
    size: new google.maps.Size(24, 24),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(12, 24)
    };

        var marker = new google.maps.Marker({
          position: myLatLng,
          map: map,
          title: name,
          icon:pinImage
        });
        if(visible){
        marker.setMap(map);
        }
        else
        marker.setMap(null);
        return marker;
    }

      function retrieveSideNavInf(){
    sidenav = document.getElementById('sidenav');
    sidenavbutton = document.getElementById('sidenavbutton');
    sidenav.style.display = 'none';
    sidenavbutton.style.display = 'none';
    savedSideNavDisplay = sidenav.style.display;
    savedSideNavButtonDisplay = sidenavbutton.style.display;
}

function LiveTrackController($scope, $http, $window, apiBase, $stateParams, apiMapsBase, $interval){
retrieveSideNavInf();
var stop;
var currentPositions = {};
        var sidenav = document.getElementById('sidenav');
        var sidenavbutton = document.getElementById('sidenavbutton');
        sidenav.style.display = 'none';
        sidenavbutton.style.display = 'none';
        $scope.showOverview = true;
        var savedEventdevices = [];
        map = preInitiate('map-canvas2');
        var kmlLayer = initiateGoogleMaps(apiMapsBase, $stateParams.mapId, map);

    function updateMarker(locations, eventdevice){
      if($scope.marker[device] != null){
        var deviceLocation = locations[locations.length-1];
        var marker = savedMarkers[eventdevice._id];
        var result = [deviceLocation.latitude, deviceLocation.longitude];
        transition(result, marker);
      }
    }

    function transition(newPosition, marker, oldPositions){
      var i = 0;
      var deltaLat = (newPosition.latitude - oldPositions[0])/numDeltas;
      var deltaLng = (newPosition.longitude - oldPositions[1])/numDeltas;
      var transitionStop = $interval(function(){
        oldPositions[0] += deltaLat;
        oldPositions[1] += deltaLng;
        var latlng = new google.maps.LatLng(oldPositions[0], oldPositions[1]);
        marker.setPosition(latlng);
        if(i != numDeltas)
        i++;
        else
          $interval.cancel(transitionStop);
      }, 10);
    }

   $http({
    url: apiBase + '/event/eventWithLocations',
    method: 'GET',
    params: {id: $stateParams.eventId}
   }).
   success(function(data, status, headers, config) {
      for(var a = 0; a<data.courses.length; a++){
        var course = data.courses[a];
        var myEventDevices = {};
        for(var b = 0; b<course.eventdevices.length; b++){
          var eventdevice = course.eventdevices[b];
          eventdevice.color = getRandomColor();
          savedEventdevices.push(eventdevice._id);
          myEventDevices[eventdevice._id] = eventdevice;
        }
        myCourses[course._id] = myEventDevices;
      }
      $scope.event = data;
  });
    $scope.changeVisibilityOfMarker = function(eventdevice){
      var aktualMarker = savedMarkers[eventdevice._id];
      if(eventdevice.visible){
        aktualMarker.setMap(map);
      }
      else aktualMarker.setMap(null);
    }

    function floatCompare(float1, float2){
      return (Math.round(parseFloat(float1)*1000000)/1000000) === (Math.round(parseFloat(float2)*1000000)/1000000)
    }

   $scope.startFetch = function(){
    if(angular.isDefined(stop)) return;
    stop = $interval(function(){
         $http({
    url: apiBase + '/devicelocation/eventDevicesFromArrayOfDeviceLocations',
    method: 'GET',
    params: {eventdevices: JSON.stringify(savedEventdevices)}
   }).
   success(function(data, status, headers, config) {
    currentPositions = data;
    if($scope.choosenCourse != null){
      var course = myCourses[$scope.choosenCourse._id];
      
      for(var property in course){
        var eventdevice = course[property];
        var marker = savedMarkers[eventdevice._id];
        var positions = currentPositions[eventdevice._id];
        if(marker == null && positions.locations.length > 0){
          var location = positions.locations[positions.locations.length - 1];
          marker = insertMarker(location.latitude, location.longitude, eventdevice.runner.name, map, eventdevice.visible, eventdevice.color);
          savedMarkers[eventdevice._id] = marker;
        }
        else if(marker != null && positions.locations.length > 0){
          var currentPosition = marker.getPosition();
          var lastPosition = positions.locations[positions.locations.length - 1];
          if(!floatCompare(lastPosition.latitude, currentPosition.G) || !floatCompare(lastPosition.longitude, currentPosition.K)){
            var currentPositionArray = [currentPosition.G, currentPosition.K];
            transition(lastPosition, marker, currentPositionArray);
          }
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

     $scope.$watch('choosenCourse', function (course) {
    courseChoosen(course, new Date().getTime());
  });

   $scope.startFetch();
   $scope.$on('$destroy', function(){
    $scope.stopFetch();
    $rootScope.hideDrawer = false;
    sidenav.style.display = savedSideNavDisplay;
    sidenavbutton.style.display = savedSideNavButtonDisplay;
   });
}

function HistoryTrackController($scope, $http, $window, apiBase, $stateParams, apiMapsBase, $mdDialog, $interval, $rootScope){

        var timelineoverlay = document.getElementById("playlineoverlay");  
        var timeline = document.getElementsByClassName("playlineline")[0];
        retrieveSideNavInf(); 
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
        map = preInitiate('map-canvas');
        var kmlLayer = initiateGoogleMaps(apiMapsBase, $stateParams.mapId, map);
        var myCourses = {};
    function transition(from, to, marker){
        var latlng = new google.maps.LatLng(to.latitude, to.longitude);
        marker.setPosition(latlng);

    }
    $scope.changeVisibilityOfMarker = function(eventdevice){
      var aktualMarker = savedMarkers[eventdevice._id];
      if(eventdevice.visible){
        aktualMarker.setMap(map);
      }
      else aktualMarker.setMap(null);
    }
$http({
    url: apiBase + '/event/eventWithLocations',
    method: 'GET',
    params: {id: $stateParams.eventId}
   }).
   success(function(data, status, headers, config) {
      aktualLength = (data.end - data.start) + constantAddition;
      definedStart = data.start - constantAddition;
      $scope.currentTime = data.start - constantAddition;
      $scope.play();
      for(var a = 0; a<data.courses.length; a++){
        var course = data.courses[a];
        var myEventDevices = {};
        for(var b = 0; b<course.eventdevices.length; b++){
          var eventdevice = course.eventdevices[b];
          eventdevice.color = getRandomColor();
          myEventDevices[eventdevice._id] = eventdevice;
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
      $scope.retrieveCurrentTimeLine();
      updatePositions();
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

   function updatePositions(){
        if($scope.choosenCourse != null){
          var selectedCourse = myCourses[$scope.choosenCourse._id];
          for (var property in selectedCourse) {
            var eventDevice = selectedCourse[property];
            var currentIndex = eventDevice.index;
            updateIndexOnEventDevice(eventDevice);
            var newIndex = eventDevice.index;
            if(currentIndex != newIndex){
              var marker = savedMarkers[eventDevice._id];
              if(marker == null){
                var currentPositon = eventDevice.location.locations[eventDevice.index];
                marker = insertMarker(currentPositon.latitude, currentPositon.longitude, eventDevice.runner.name, map, eventDevice.visible, eventDevice.color);
                savedMarkers[eventDevice._id] = marker;
              }
              else{
                var from = marker.getPosition();
                var to = eventDevice.location.locations[eventDevice.index];
                transition(from, to, marker);
               }
            }
         }
      }
   }

   $scope.play = function(){
    var fetchFrequence = 100;
    $scope.playing = true;
         stop = $interval(function(){
          $scope.currentTime += fetchFrequence * $scope.choosenSpeed;
          $scope.retrieveCurrentTimeLine();
          updatePositions();
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

  $scope.$watch('choosenCourse', function (course) {
      courseChoosen(course, $scope.currentTime);
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