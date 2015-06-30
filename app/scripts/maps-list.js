'use strict'

var app = angular.module('mapsList');

app.controller("MapsListController", mapCtrl);

function mapCtrl($scope,$location, $http, $filter, $state, ngDialog, apiBase){
  $scope.tablePage = 0;
    $http.get(apiBase + '/map/allmapsnoimage').
  success(function(data, status, headers, config) {
          for(var a = 0; a<data.length; a++){
            var object = data[a];
            object.modified = new Date(object.modified*1000).format('j F Y');
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
    console.log('Am i here');
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
                    if(found){
                    var reader = new FileReader();
                  reader.onload = function(readerEvt) {
                  var binaryString = readerEvt.target.result;
                  $scope.imageActive = true;
                  $scope.currentImage = btoa(binaryString);
              };
              reader.readAsBinaryString(myFile);
            }
            else{
              alert('Wrong format');
            }
    }
  }
      $scope.pushMap = function () {
        var mapToUpload = {name: $scope.newname, image: $scope.currentImage, size: $scope.newsize};
        // Simple POST request example (passing data) :
        var request = new XMLHttpRequest();
        var path = apiBase + '/map';
        request.open("POST", path, true);
        request.setRequestHeader("Accept", "application/json");
        request.setRequestHeader("Content-type", "application/json");
        request.onreadystatechange = maploaded;
        request.send(JSON.stringify(mapToUpload));
          function maploaded() {
            if(request.readyState == 4) {
              var index = $scope.content.indexOf(mapToUpload);
              if (request.status == 200 ) {
                var map = $scope.content[index];
                var mapId = {};
                mapId.$oid = request.responseText;
                map._id = mapId;
              } else {
                $scope.content.splice(index, 1);
              }
            }
        }
        mapToUpload.modified = new Date().format('j F Y');
        $scope.content.push(mapToUpload);
        ngDialog.closeAll();

      };
      $scope.imageActive = false;
      $scope.$watch('files', function () {
        $scope.upload($scope.files);
    });

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
        $scope.newname = "";
        $scope.newsize = "";
        $scope.currentImage = null;
        ngDialog.open({
          template: 'firstDialogId',
          scope: $scope,
          className: 'ngdialog-theme-default'
        });
      };
    }

app.filter('startFrom',function (){
  return function (input,start) {
    if(input != null){
    start = +start;
    return input.slice(start);
    }
    else{
      return [];
    }
  }
});