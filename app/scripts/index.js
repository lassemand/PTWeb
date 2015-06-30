'use strict'

angular.module('map', ['ngMaterial','StarterApp']);
angular.module('mapsList', ['ngMaterial', 'ngDialog', 'angularFileUpload', 'StarterApp', 'ngMdIcons']);
angular.module('register', ['ngMaterial', 'StarterApp']);

var app = angular.module('StarterApp', ['ngMaterial', 'ngDialog', 'mapsList', 'ui.router', 'map', 'ngMessages', 'ngMdIcons']);

app.run(function ($rootScope, $state, loginService) {
  $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
    var requireLogin = toState.data.requireLogin;
    if (requireLogin && loginService.notLoggedIn()) {
      event.preventDefault();
      loginService.loginModal().then(function(){
        return $state.go(toState.name, toParams);
      }).
      catch(function () {
          return $state.go('home');
      });
    }
  });
});

app.controller('LoginModalCtrl', function ($scope, $rootScope, $mdDialog, $http, loginService, apiBase) {
  $scope.falseLogin = false;
    $scope.submit = function (username, password) {
      loginService.usrLogin(username, password).
      success(function(data, status, headers, config) {
          var auth = data.token + ":" + data.username;
          $http.defaults.headers.common['Token'] = auth;
          localStorage.setItem('currentUser', JSON.stringify(data));
          //$rootScope.currentUser = data;
          $mdDialog.hide();
      }).
      error(function(data, status, headers, config) {
         $scope.falseLogin = true;
      });;
    };

    $scope.registerDialog = function() {
      $parent.registerUser();
    };

});

app.constant('apiBase', (function() {
  return 'http://localhost:8080/PersonalTrack/rest';
})());

app.service('loginService', function ($http, $mdDialog, apiBase, $rootScope) {

    this.usrLogin = function(username, password) {
      var requestBody = {}
      requestBody.username = username;
      requestBody.password = password;
      var apiRequest = apiBase + '/token/retrieve';
       return $http({
            url: apiRequest,
            method: 'POST',
            data: requestBody
      });
    }

    this.user = function(){
      //return $rootScope.currentUser;
      var retrievedObject = localStorage.getItem("currentUser") 
      return JSON.parse(retrievedObject);
    }

    this.notLoggedIn = function(){
      //return typeof $rootScope.currentUser === 'undefined';
      return localStorage.getItem("currentUser") === null;
    }

    this.setupHttp = function(){
          $http.defaults.headers.common['Content-type'] = "application/json";
          $http.defaults.headers.common['Accept'] = "application/json";
      }

      this.logout = function(){
        localStorage.removeItem('currentUser');
      }

  this.loginModal = function() {
    var instance =  $mdDialog.show({
        templateUrl: 'loginDialog',
        controller: 'LoginModalCtrl'
      });
      return instance;
  };

    });
    

app.controller("AppCtrl", AppCtrl);

function AppCtrl($scope, $log, $http, $upload, $location, $mdBottomSheet, $mdSidenav, apiBase, loginService){
  loginService.setupHttp();
  $scope.toggleSidenav = function(menuId) {
    $mdSidenav(menuId).toggle();
  };
  $scope.menu = [{icon: "dashboard", title: "Main Page", reference: "main"}];

  $scope.login = function(){
      loginService.loginModal();
  }

  $scope.registerUser = function() {
        $location.path('register');
  }

  $scope.notLoggedIn = function(){
    return loginService.notLoggedIn();
  }

    $scope.user = function(){
    return loginService.user();
  }

  $scope.logout = function(){
    console.log("logout");
    return loginService.logout();
  }


}

var compareTo = function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {
             
            ngModel.$validators.compareTo = function(modelValue) {
              
                return modelValue === scope.otherModelValue;
            };
 
            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
};

var usernameExist = function($http, apiBase, $q) {
 return {
    restrict: 'AE',
    require: 'ngModel',
    link: function(scope, elm, attr, model) { 
      model.$asyncValidators.usernameExists = function(modelValue) {
        return  $http({
            url: apiBase + '/runner/usernameAvailable',
            method: 'GET',
            params: {username: modelValue}
      }).then(function(response){
        if(!response.data.available) return $q.reject();
        return true;
      });
      };
    }
  } 
};

var emailExist = function($http, apiBase, $q) {
 return {
    restrict: 'AE',
    require: 'ngModel',
    link: function(scope, elm, attr, model) { 
      model.$asyncValidators.emailExists = function(modelValue) {
        return  $http({
            url: apiBase + '/runner/emailAvailable',
            method: 'GET',
            params: {email: modelValue}
      }).then(function(response){
        if(!response.data.available) return $q.reject();
        return true;
      });
      };
    }
  } 
};

app.directive("emailExist", emailExist); 
app.directive("usernameExist", usernameExist); 
app.directive("compareTo", compareTo);

app.config(
  function($stateProvider, $urlRouterProvider) {

    var main = {
        name: 'main',
        url: '/main',
        controller: 'MainController',
        templateUrl: 'partials/mainpage.html',
      data: {
        requireLogin: false
      }
    };

    var maps = {
        name: 'maps',
        url: '/maps',
        controller: 'MapsListController',
        templateUrl: 'partials/maps-list.html',
      data: {
        requireLogin: true
      }
    };

    var map = {
        name: 'map',
        url: '/map/:mapId',
        templateUrl: 'partials/map.html',
        controller: 'MapController',
      data: {
        requireLogin: false
      }
    };

      var register = {
        name: 'register',
        url: '/register',
        templateUrl: 'partials/register.html',
        controller: 'MyRegisterController',
      data: {
        requireLogin: false
      }
    };

    $stateProvider
    .state(maps)
    .state(map)
    .state(register);

    });

app.config(function($mdThemingProvider) {
  var customBlueMap =     $mdThemingProvider.extendPalette('light-blue', {
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50'],
    '50': 'ffffff'
  });
  $mdThemingProvider.definePalette('customBlue', customBlueMap);
  $mdThemingProvider.theme('default')
    .primaryPalette('customBlue', {
      'default': '500',
      'hue-1': '50'
    })
    .accentPalette('pink');
  $mdThemingProvider.theme('input', 'default')
        .primaryPalette('grey')
});

app.config(function ($httpProvider) {

  $httpProvider.interceptors.push(function ($timeout, $q, $injector) {
    var loginModal, $http, $state;

    // this trick must be done so that we don't receive
    // `Uncaught Error: [$injector:cdep] Circular dependency found`
    $timeout(function () {
      loginModal = $injector.get('loginService');
      $http = $injector.get('$http');
      $state = $injector.get('$state');
    });

    return {
      responseError: function (rejection) {
        if (rejection.status !== 401) {
          return rejection;
        }

        var deferred = $q.defer();

        loginService.loginModal()
          .then(function () {
            deferred.resolve( $http(rejection.config) );
          })
          .catch(function () {
            $state.go('welcome');
            deferred.reject(rejection);
          });
        return deferred.promise;
      }
    };
  });
});
