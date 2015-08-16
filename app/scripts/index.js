'use strict'

angular.module('map', ['ngMaterial','StarterApp']);
angular.module('mapsList', ['ngAnimate', 'ngAria', 'ngMaterial', 'angularFileUpload', 'StarterApp', 'ngMdIcons']);
angular.module('register', ['ngMaterial', 'StarterApp']);

var objectApiGroundBase = 'http://46.101.134.212:8080/PersonalTrack';
var app = angular.module('StarterApp', ['ngMaterial', 'mapsList', 'ui.router', 'map', 'ngMessages', 'ngMdIcons', 'mdPickers']);

app.run(function ($rootScope, $state, loginService) {
  $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
    var requireLogin = toState.data.requireLogin;
    if (requireLogin && !loginService.loggedIn()) {
      event.preventDefault();
      loginService.loginModal().then(function(){
        return $state.go(toState.name, toParams);
      }).
      catch(function () {
          return $state.go('main');
      });
    }
  });
});

app.controller('LoginModalCtrl', function ($scope, $rootScope, $mdDialog, $http, loginService, apiBase, $location) {
  $scope.falseLogin = false;
    $scope.submit = function (username, password) {
      loginService.usrLogin(username, password).
      success(function(data, status, headers, config) {
          loginService.setupToken(data.token, data.username);
          loginService.updateUser(data);
          $mdDialog.hide();
          console.log('Succes' + status);
      }).
      error(function(data, status, headers, config) {
         $scope.falseLogin = true;
         console.log('error' + status);
      });
    };

    $scope.registerDialog = function() {
      $location.path('register');
      $mdDialog.hide();
    };

});

app.constant('apiMapsBase', (function() {
  return objectApiGroundBase + '/maps/';
})());

app.constant('apiBase', (function(apiGroundBase) {
  return objectApiGroundBase + '/rest';
})());

app.service('loginService', function ($http, $mdDialog, apiBase, $rootScope) {

    this.setupToken = function(token, username){
          var auth = token + ":" + username;
          $http.defaults.headers.common['Token'] = auth;
    }

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

    this.updateUser = function(activeUser){
      localStorage.setItem('currentUser', JSON.stringify(activeUser));
    }

    this.user = function(){
      var retrievedObject = localStorage.getItem("currentUser") 
      return JSON.parse(retrievedObject);
    }

    this.loggedIn = function(){
      var myuser = JSON.parse(localStorage.getItem("currentUser"));
      return localStorage.getItem("currentUser") !== null && myuser !== null && myuser.hasOwnProperty('token');
    }

    this.setupHttp = function(){
          $http.defaults.headers.common['Content-type'] = "text/plain";
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

app.service('dateConverter', function () {
  var myFunctions = {
    dateFormat : function(mydate){
      return mydate.format('j F Y');
    },
    convertLong : function(longDate){
      return myFunctions.dateFormat(new Date(longDate));
    }
  }
  return myFunctions;
});
    


app.controller("AppCtrl", AppCtrl);

function AppCtrl($scope, $log, $http, $upload, $location, $mdBottomSheet, $mdSidenav, apiBase, loginService, $state, $window){

  loginService.setupHttp();
  if(loginService.loggedIn()){
    var user = loginService.user();
    loginService.setupToken(user.token, user.username);
    $http({
            url: apiBase + '/runner',
            method: 'GET',
            params: {id: user._id.$oid}
      }).success(function(data, status, headers, config) {
        data.username = user.username;
        data.token = user.token;
        loginService.updateUser(data);
      });
  }
  $scope.toggleSidenav = function(menuId) {
    $mdSidenav(menuId).toggle();
  };

  $scope.siderow = [{header: "Home Settings", body:[{icon: "dashboard", title: "Main Page", reference: "main"}]}, 
  {header: "User", body:[{icon: "terrain", title: "Maps", reference: "maps"}, {icon: "person", title: "Update information", reference: "update/"}, 
  {icon: "devices", title: "Devices", reference: "devices"}, {icon: "event", title: "Events", reference: "events"}]},
  {header: "Team", body:[{icon: "account_circle", title: "Your teams", reference: "team"}]}];

  $scope.login = function(){
      loginService.loginModal();
  }

  $scope.loggedIn = function(){
    return loginService.loggedIn();
  }

    $scope.user = function(){
    return loginService.user();
  }

  $scope.logout = function(){
     loginService.logout();
     $state.go('main');
  }

  $scope.changeLocation = function(location){
    $location.path(location);
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
        if(!response.data.available) return $q.reject("Username exists");
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
        if(!response.data.available) return $q.reject("Email exists");
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
        controller: 'MainPageCtrl',
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
        requireLogin: true
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

      var userupdate = {
        name: 'user_update',
        url: '/update/:section',
        templateUrl: 'partials/user_update.html',
        controller: 'UserUpdateController',
      data: {
        requireLogin: true
      }
    };

      var teamconf = {
        name: 'team',
        url: '/team',
        templateUrl: 'partials/team.html',
        controller: 'TeamController',
      data: {
        requireLogin: true
      }
    };

      var devices = {
        name: 'devices',
        url: '/devices',
        templateUrl: 'partials/devices.html',
        controller: 'DeviceController',
      data: {
        requireLogin: true
      }
    };

      var events = {
        name: 'events',
        url: '/events',
        templateUrl: 'partials/events.html',
        controller: 'EventsController',
      data: {
        requireLogin: true
      }
    };

      var eventcreate = {
        name: 'eventcreate',
        url: '/events/create',
        templateUrl: 'partials/eventcreate.html',
        controller: 'EventCreateController',
      data: {
        requireLogin: true
      }
    };

    var myevent = {
        name: 'event',
        url: '/event/:eventId',
        templateUrl: 'partials/event.html',
        controller: 'MyEventCtrl',
      data: {
        requireLogin: true
      }
    };

    var addtoevent = {
        name: 'eventdevice',
        url: '/eventdevice?eventId&type',
        templateUrl: 'partials/eventdevice.html',
        controller: 'EventDeviceController',
      data: {
        requireLogin: true
      }
    };

      var liveTrackController = {
        name: 'Live Track',
        url: '/track_live?eventId&mapId',
        templateUrl: 'partials/track_live.html',
        controller: 'LiveTrackController',
      data: {
        requireLogin: true
      }
    };

      var historyTrackController = {
        name: 'History Track',
        url: '/track_history?eventId&mapId',
        templateUrl: 'partials/track_history.html',
        controller: 'HistoryTrackController',
      data: {
        requireLogin: true
      }
    };

    $stateProvider
    .state(main)
    .state(maps)
    .state(map)
    .state(userupdate)
    .state(register)
    .state(teamconf)
    .state(devices)
    .state(eventcreate)
    .state(events)
    .state(myevent)
    .state(addtoevent)
    .state(liveTrackController)
    .state(historyTrackController);
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
          return $q.reject(rejection);
        }
        
        var deferred = $q.defer();

        loginModal.loginModal()
          .then(function () {
            deferred.resolve( $http(rejection.config) );
          })
          .catch(function () {
            $state.go('main');
            deferred.reject(rejection);
          });
        return deferred.promise;
      }
    };
  });
});

 
