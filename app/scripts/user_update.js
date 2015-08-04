'use strict'

var app = angular.module('StarterApp');

app.controller("UserUpdateController", UserUpdateController);

function UserUpdateController($scope, $window, apiBase, $http, loginService, $document, $location){
  
  		$scope.user = loginService.user();
      $scope.updateUser = {};
      $http({
            url: apiBase + '/device/devicesFromRunner',
            method: 'GET',
            params: {id: $scope.user._id.$oid}
      }).
      success(function(data, status, headers, config) {
        console.log(data);
        $scope.devices = data;
        if($scope.user.defaultdevice != null){
          for(var a = 0; a<$scope.devices.length; a++){
            if($scope.devices[a]._id.$oid == $scope.user.defaultdevice){
              $scope.aktualDefaultDevice = $scope.devices[a];
              console.log($scope.aktualDefaultDevice);
              break;
            }
          }
          if($scope.aktualDefaultDevice == null){
            console.log('test');
          }
        }
      });
  		$scope.fields = ['Name', 'Password', 'Email'];

      $scope.refresh = function(){
        $location.path('update/');
      }

  		$scope.cancel = function(){
  			$window.history.back();
  		}
  		$scope.update = function(id){
        $location.path('update/'+ id);
  		}

      var returnAction = function(){
        angular.extend($scope.user, $scope.user, $scope.updateUser);
        loginService.updateUser($scope.user);
        $location.path('update/');
      }

      $scope.updateRow = function(){        
        $http({
            url: apiBase + '/runner',
            method: 'PUT',
            params: {id: $scope.user._id.$oid},
            data: $scope.updateUser
      }).then(function(){
        returnAction();
      });
      }

      $scope.updateDefaultDevice = function(deviceId){
        $scope.updateUser.defaultdevice = deviceId._id.$oid;
        console.log($scope.updateUser);
               $http({
            url: apiBase + '/runner/updateDefaultDevice',
            method: 'PUT',
            params: {id: $scope.user._id.$oid},
            data: $scope.updateUser
      }).then(function(){
        returnAction();
      });

      }

  		$scope.highlight = function(id){
			 var obj = document.getElementById(id);
			 obj.className = 'settingsHighlighted';  			

  		}
  		$scope.removeHightlight = function(id){
  			var obj = document.getElementById(id);
			  obj.className = '';
  		}
  }
 var replaceElement = function($stateParams, $timeout, $templateCache, $compile) {
 return {
    restrict: 'AE',
        compile:function(elm,tAttrs){
          if(elm[0].id === $stateParams.section){
            var name = 't' + $stateParams.section;
            elm.replaceWith($templateCache.get(name));
          }
      }
  } 
};
app.directive("replaceElement", replaceElement);

var checkPassword = function($http, apiBase, $q, loginService) {
 return {
    restrict: 'AE',
    require: 'ngModel',
    link: function(scope, elm, attr, model) { 
      model.$asyncValidators.correctPasswords = function(modelValue) {
        console.log('CorrectPassword');
        return  $http({
            url: apiBase + '/runner/checkPassword',
            method: 'GET',
            params: {username: loginService.user().username, password: modelValue}
      }).then(function(response){
        if(!response.data.available) return $q.reject();
        return true;
      });
      };
    }
  } 
};
app.directive("checkPassword", checkPassword); 