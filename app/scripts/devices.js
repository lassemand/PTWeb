'use strict'

var app = angular.module('StarterApp');

app.controller("DeviceController", deviceCtrl);
app.controller("CrtDeviceCtrl", createCtrl);

function createCtrl($scope, apiBase, $http, loginService, $mdDialog){
  $scope.user = loginService.user();
  $scope.cancel = function(){
    $mdDialog.hide();
  }

  $scope.deviceSubmit = function(name, identifier){
    var device = {"runner": $scope.user._id.$oid, "name":name, "identifier": identifier};
    
     $http({
          url: apiBase + '/device',
          method: 'POST',
          data: device
      }).success(function(data, status, headers, config) {
        device._id = {$oid: data};
        $mdDialog.hide(device);
      });
  }

}

function deviceCtrl($scope, apiBase, $http, loginService, $mdDialog){
  $scope.user = loginService.user();
  $scope.headers = [
     {
        name: 'Name', 
        field: 'name'
      }
    ];
  $http({
          url: apiBase + '/device/devicesFromRunner',
          method: 'GET',
          params: {id: $scope.user._id.$oid}
      }).success(function(data, status, headers, config) {
          $scope.devices = data;
      });

    $scope.createDialog = function(ev){
      var instance =  $mdDialog.show({
        templateUrl: 'createDevice',
        controller: 'CrtDeviceCtrl',
        targetEvent: ev
      }).then(function(device){
        $scope.devices.push(device);
      });
    }
}

var deviceValidation = function($http, apiBase, $q) {
 return {
    restrict: 'AE',
    require: 'ngModel',
    link: function(scope, elm, attr, model) { 
      model.$asyncValidators.deviceValidation = function(modelValue) {
        return  $http({
            url: apiBase + '/device/validateDevice',
            method: 'GET',
            params: {device: modelValue}
      }).then(function(response){
        if(!response.data.available) return $q.reject();
        return true;
      });
      };
    }
  } 
};

app.directive(deviceValidation);