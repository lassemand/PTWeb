'use strict'

var app = angular.module('StarterApp');

app.controller("TeamController", teamCtrl);
app.controller("loginModalCtrl", loginModalCtrl);
app.controller("runnerCtrl", runnerCtrl);

function teamCtrl($scope, $window, apiBase, $http, loginService, $mdDialog){
  $scope.user = loginService.user();
      $scope.headers = [
     {
        name: 'Name', 
        field: 'name'
      }
    ];
      $http({
            url: apiBase + '/team/teamsById',
            method: 'GET',
            params: {id: JSON.stringify($scope.user.team)}
      }).success(function(data, status, headers, config) {
        $scope.teams = data;
        $scope.optionvalue = $scope.teams[0];
      });


  $scope.createDialog = function(ev){
        var instance =  $mdDialog.show({
        templateUrl: 'createTeam',
        controller: 'loginModalCtrl',
        targetEvent: ev
      });
        return instance;
  }

  $scope.addRunner = function(ev){
      var instance =  $mdDialog.show({
        templateUrl: 'addRunner',
        controller: 'runnerCtrl',
        targetEvent: ev,
        locals : {
          team : $scope.optionvalue
        }
      });
        return instance;
  }
}
 function loginModalCtrl($scope, $window, apiBase, $http, loginService, $mdDialog){
  $scope.user = loginService.user();

  $scope.cancel = function(){
    $mdDialog.hide();
  }

  $scope.teamSubmit = function(name){
    var data = {name: name, runnerId: $scope.user._id.$oid};
      $http({
            url: apiBase + '/team',
            method: 'POST',
            data: data
      }).then(function(response){
        $mdDialog.hide();
      });
  }
}

 function runnerCtrl($scope, $window, apiBase, $http, loginService, $mdDialog, $filter, team){
  
  $scope.user = loginService.user();  
  $scope.runners = [];

      $http({
            url: apiBase + '/runner/runners',
            method: 'GET'
    }).
      success(function(data, status, headers, config) {
        var tempValues = [];
        for(var a = data.length-1; a>-1; a--){ 
          var runner = data[a];
          for(var b = 0; b<team.runners.length; b++){
            if(team.runners[b]._id.$oid === runner._id.$oid){
                data.splice(a, 1);
                break;
            }
          }
        }
        $scope.allRunners = data;
      });

  $scope.addRunners = function(runner){
    $scope.runners.push(runner);
  }

  $scope.cancel = function(){
    $mdDialog.hide();
  }

  $scope.addRunner = function(){
    var tempArray = [];
    $scope.runners.forEach(function(value){
      tempArray.push(value._id.$oid);
      team.runners.push(value);
    });
      $http({
            url: apiBase + '/team/addRunnersToTeam',
            method: 'PUT',
            params: {id: team._id.$oid},
            data: tempArray
      }).then(function(response){
        $mdDialog.hide();
      });
  }
}

app.filter('removeAdded',function (loginService){
  return function (input, runners) {
    if(input != null && runners != null){
     var user = loginService.user();
      for(var a = 0; a<runners.length; a++){
         var runner = runners[a];
         var index = input.indexOf(runner);
         if(index != -1) input.splice(index, 1);

      }
      return input;
    }
    else return [];
  }
});


