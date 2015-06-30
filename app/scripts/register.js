'use strict'

var app = angular.module('StarterApp');

app.controller("MyRegisterController", RegisterController);

function RegisterController($scope, $window, apiBase, $http){
	$scope.user = {};
  		$scope.cancel = function(){
  			$window.history.back();
  		}
  		$scope.register = function(){
  			var validater = $scope.infoValidater;
  			var user = {name: $scope.user.firstname + ' ' + $scope.user.lastname, username: $scope.user.username, password: $scope.user.password, email: $scope.user.email};
  			console.log(JSON.stringify(user));
  			$http({
  			url: apiBase + '/runner/createRunner',
  			method: 'POST',
  			data: user,
  			headers: {'Accept': 'application/json', 'Content-type': 'application/json'}
			});
  			$window.history.back();
  		}
}

