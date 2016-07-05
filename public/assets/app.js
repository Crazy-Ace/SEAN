//just define module & its dependencies
var app = angular.module('app', [
  'ngRoute',
  'ngCookies',
  'ngAnimate',
  'ngFlash'
  // 'ngSanitize',
  // 'ngTagsInput',
  // 'firebase'
]);


(function () {
    'use strict';

    angular
        .module('app')
        .config(config)
        .run(run)

    config.$inject = ['$routeProvider', '$locationProvider'];
    function config($routeProvider, $locationProvider,$rootScope) {
        $routeProvider
        .when('/login', { controller: 'LoginCtrl', templateUrl: 'login.html' })
        .when('/register', { controller: 'RegisterCtrl', templateUrl: 'register.html' })
        .when('/home',{ controller: 'HomeCtrl', templateUrl: 'home.html' })
        .otherwise({ redirectTo: '/login' });

        // configure html5 to get links working
        // If you don't do this, you URLs will be base.com/#/home rather than base.com/home
        $locationProvider.html5Mode(true);
    }

    run.$inject = ['$rootScope', '$location', '$cookieStore', '$http'];
    function run($rootScope, $location, $cookieStore, $http) {

        // keep user logged in after page refresh
        $rootScope.globals = $cookieStore.get('globals') || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['x-auth'] = $rootScope.globals.currentUser.authdata; // jshint ignore:line
        }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = $.inArray($location.path(), ['/', '/login', '/register']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (restrictedPage && !loggedIn) {
                $location.path('/login');
            }

            // redirect to home page if logged in and trying to access login page
            if (loggedIn && !restrictedPage) {
                $location.path('/home');
            }

        });
    }
})();

angular.module('app')
.directive('regularHomeView', function () {
  return {
    restrict: 'E',
    templateUrl: 'regularUser/home.html'
    //css: 'my-directive/my-directive.css'
  }
})
.directive('adminHomeView', function () {
  return {
    restrict: 'E',
    templateUrl: 'admin/home.html'
    //css: 'my-directive/my-directive.css'
  }
});

angular.module('app')
.controller('ApplicationCtrl', function ($scope, $rootScope) {

  //when user refreshes page, mk sure use is set
  $scope.currentUser = $rootScope.globals.currentUser? $rootScope.globals.currentUser.data : {};

  //when user logs in, receive signal on login
  $scope.$on('login', function () {
    $scope.currentUser = $rootScope.globals.currentUser.data;
  });

 });

angular.module('app')
.controller('HomeCtrl', function ($scope, $rootScope, $location, UserService) {

  //get all usres
  UserService.getAllUsers().then(function(response){
    $scope.users = response.users;
  })

  $scope.delete = function (userId) {
    //delete user
    UserService.delete(userId);

    //refresh list
    UserService.getAllUsers().then(function(response){
      $scope.users = response.users;
    })

  }

  $scope.logout = function () {
    UserService.clearCredentials();
    //go back to sigin page
    $location.path('/');
    $scope.currentUser = null;
  }

 });

angular.module('app')
.controller('LoginCtrl', function ($scope, $rootScope, $location, FlashService, UserService) {

	$scope.login = function(username, password, remember) {

			var rememberMe = remember || false;
			if(!username || !password)return;

			$scope.dataLoading = true;

    	UserService.login({username:username, password:password, rememberMe:rememberMe})
	    .then(function (response) {
				console.log(response);
            if (response.success) {
							UserService.clearCredentials();
						 	UserService.setCredentials(response.user, response.token);
							$scope.$emit('login');
              $location.path('/home');
            } else {
              FlashService.failureAlert("Your username or password is incorrect.");
              $scope.dataLoading = false;
            }
        });
  }

 });

var app = angular.module('app');
app.controller('RegisterCtrl', function ($scope, $location, UserService) {

  $scope.register = function(firstName, lastName, username, password) {
    console.log(firstName, lastName, username, password);

    //if(firstName && lastName && username && password){
 	   	$scope.dataLoading = true;

    	var user = {
    		 firstName: firstName,
    		 lastName: lastName,
    		 username: username,
    		 password: password,
         roleId: 0
    	}

    	UserService.register(user)
	    .then(function (response) {
            if (response.success) {
                //FlashService.Success('Registration successful', true);
                $location.path('/');
            } else {
                //FlashService.Error(response.message);
                $scope.dataLoading = false;
            }
        });
    //}
  }
});

var app = angular.module('app');
 app.service('FlashService', function (Flash) {
   /*
   * Have this tag in the html file you would like
   * the flash message displayed.
   *  <flash-message>
   *  </flash-message>
   */

   //Flash argument params used in the functions below
   // First argument (string) is the type of the flash alert.
   // Second argument (string) is the message displays in the flash alert (HTML is ok).
   // Third argument (number, optional) is the duration of showing the flash. 0 to not automatically hide flash (user needs to click the cross on top-right corner).
   // Fourth argument (object, optional) is the custom class and id to be added for the flash message created.
   // Fifth argument (boolean, optional) is the visibility of close button for this flash.
   // Returns the unique id of flash message that can be used to call Flash.dismiss(id); to dismiss the flash message.
   var flashSvc = this;

   flashSvc.successAlert = function (alertMessage) {
       var message = '<strong> Well done!</strong>  '+alertMessage;
       var id = Flash.create('success', message, 3000, {class: 'custom-class', id: 'custom-id'}, true);
   }

  flashSvc.failureAlert = function (alertMessage) {
     var message = '<strong> OOps!</strong>  '+alertMessage;
     var id = Flash.create('danger', message, 3000, {class: 'custom-class', id: 'custom-id'}, true);
  }

});

var app = angular.module('app');
 app.service('UserService', function ($http, $rootScope, $cookieStore) {
   var svc = this;

   svc.getAllUsers = function () {
     return $http.get('/api/users').then(handleSuccess, handleError('Error getting all users'));
   }

   svc.register = function (user) {
     return $http.post('/api/users', user).then(handleSuccess, handleError('Error creating user'));
   }

    svc.login = function (credentials) {
     return $http.post('/api/authenticate', credentials).then(handleSuccess, handleError('Error login in user'));
   }

   svc.delete = function (userId) {
    return $http.delete('/api/users/'+userId).then(handleSuccess, handleError('Error login in user'));
  }

   svc.setCredentials = function(user, token){
    var authdata = token;
    $rootScope.globals = {
          currentUser: {
              data: user,
              authdata: authdata
          }
      };

    //set token for all request
    $cookieStore.put('globals', $rootScope.globals);
    $http.defaults.headers.common['x-auth'] = authdata;

  }

  //clearCredentials
  svc.clearCredentials  = function () {
      $rootScope.globals = {};
      $cookieStore.remove('globals');
      $http.defaults.headers.common.Authorization = null;
  }


 });

// private functions

function handleSuccess(response) {
    //console.log(response.data);
    return response.data;
}

function handleError(error) {
    return function () {
        return { success: false, message: error };
    };
}
