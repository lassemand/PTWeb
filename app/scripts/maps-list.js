'use strict'

var app = angular.module('mapsList');

app.controller("MapsListController", mapCtrl);
app.controller("MapCreateCtrl", mapCreateController);

function mapCtrl($scope,$location, $http, $filter, $state, $mdDialog, apiBase, loginService){
  $scope.user = loginService.user();
  $scope.tablePage = 0;
  $http.get(apiBase + '/map/allmapsnoimage').
  success(function(data, status, headers, config) {
    for(var a = 0; a<data.length; a++){
      var object = data[a];
      object.modified = new Date(object.modified).format('j F Y');
    }

    $scope.nbOfPages = function () {
      return Math.ceil(data.length / $scope.count);
    },
    $scope.handleSort = function (field) {
      if ($scope.sortable.indexOf(field) > -1) { return true; } else { return false; }
    };
    $scope.order($scope.sortable[0],false, data);
    $scope.getNumber = function (num) {
      return new Array(num);
    };  
  }).
  error(function(data, status, headers, config) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
    $state.go('home');
  });
  var orderBy = $filter('orderBy');
  $scope.order = function(predicate, reverse, array) {
    $scope.content = orderBy(array, predicate, reverse);
    $scope.predicate = predicate;
  };
  $scope.custom = {name: 'bold', size:'grey',last_modified: 'grey'};
  $scope.sortable = ['name', 'description', 'modified'];
  $scope.order($scope.sortable[0],false);
  $scope.thumbs = 'thumb';
  $scope.count = 10;
  $scope.toggleSearch = false;
  $scope.searchClicked = function(){  
    $scope.toggleSearch = !$scope.toggleSearch;
  }  

      $scope.toggleSearch = false;   
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



      $scope.goToPage = function (page) {
        $scope.tablePage = page;
      };
      $scope.rowClicked = function(map) {
        var id = map._id;
        $location.path('map/'+id.$oid);
      }
      $scope.createDialog = function () {
        var instance =  $mdDialog.show({
        templateUrl: 'firstDialogId',
        controller: 'MapCreateCtrl'
      }).then(function(response){
        $scope.content.push(response);
      });
      };
      $scope.checkForMapContainedInUser = function(id){
        return $.inArray(id, $scope.user.maps)  !== -1;
      }
      $scope.addMap = function(id){

        var maps = [];
        maps.push(id);
        return  $http({
          url: apiBase + '/runner/addMaps',
          method: 'PUT',
          params: {id: $scope.user._id.$oid},
          data: maps
        }).then(function(){
          for(var a = 0; a<maps.length; a++){
            $scope.user.maps.push(maps[a]);
          }
          loginService.updateUser($scope.user);
        });
      }
      $scope.removeMap = function(id){

        var maps = [];
        maps.push(id);
        return  $http({
          url: apiBase + '/runner/removeMaps',
          method: 'PUT',
          params: {id: $scope.user._id.$oid},
          data: maps
        }).then(function(){
          for(var a = 0; a<maps.length; a++){
            var index = $scope.user.maps.indexOf(maps[a]);
            $scope.user.maps.splice(index, 1);
          }
          loginService.updateUser($scope.user);
        });
      }
    }

    function mapCreateController($scope, $mdDialog, $http, apiBase){
        $scope.pushMap = function () {
          var mapToUpload = {name: $scope.newname, image: $scope.currentImage, size: $scope.newsize};
        // Simple POST request example (passing data) :
        $http({
            url: apiBase + '/map',
            method: 'POST',
            data: mapToUpload
      }).success(function(data, status, headers, config){
          mapToUpload._id = {$oid: data._id};
          mapToUpload.modified = new Date().format('j F Y');
          $mdDialog.hide(mapToUpload);
      });
      };

        $scope.upload = function(files){
          if(files && files.length > 0){
                    var myFile = files[0];
                    var allowed = ["jpeg", "png", "jpg"];
                    var found = false;
                    var fileExtension = "jpg"
                    allowed.forEach(function(extension) {
                       if (myFile.type.match('image/'+extension)) {
                            found = true;
                            fileExtension = extension;
                          }
                        });
                    var found = true;
                    if(found){
                      var reader = new FileReader();
                      reader.onload = function(readerEvt) {
                      var binaryString = readerEvt.target.result;
                      $scope.imageActive = true;
                      $scope.currentImage = btoa(binaryString);
              };
              reader.readAsBinaryString(myFile);
              }
          }
        }

      $scope.imageActive = false;
      $scope.$watch('files', function () {
        $scope.upload($scope.files);
      });
    }

    app.filter('startFrom',function (loginService){
      return function (input,start, option, count) {
        if(input != null){
          var user = loginService.user();
          start = +start;
          var returnValue = input.slice(start);
          if(option != null){
            if(option.setting === 1){
              var tempValues = [];
              for(var a = 0; a<returnValue.length && tempValues.length < count; a++){
                if($.inArray(returnValue[a]._id.$oid, user.maps)  !== -1)
                  tempValues.push(returnValue[a]);
              }
              return tempValues;
            }
            else if(option.setting === 2){
              var tempValues = [];
              for(var a = 0; a<returnValue.length && tempValues.length < count; a++){
                if($.inArray(returnValue[a]._id.$oid, user.maps)  === -1)
                  tempValues.push(returnValue[a]);
              }
              return tempValues;
            }
          }
          return returnValue;
        }
        else{
          return [];
        }
      }
    });