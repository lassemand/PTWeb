'use strict'

var app = angular.module('StarterApp');

app.controller("MyRegisterController", RegisterController);

function RegisterController($scope, $window, apiBase, $http, loginService){
  
  $scope.user = {};

  		$scope.cancel = function(){
  			$window.history.back();
  		}
  		$scope.register = function(){
  			var validater = $scope.infoValidater;
  			var user = {name: $scope.user.firstname + ' ' + $scope.user.lastname, username: $scope.user.username, password: $scope.user.password, email: $scope.user.email};

  			$http({
  			url: apiBase + '/runner/createRunner',
  			method: 'POST',
  			data: user
			}).then(function(response){
        $window.history.back();
      });
  			
  		}
    }

