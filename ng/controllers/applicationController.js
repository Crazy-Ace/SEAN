angular.module('app')
.controller('ApplicationCtrl', function ($scope, $rootScope, $cookieStore, $location, UserService) {

  //when user refreshes page, mk sure use is set
  $scope.currentUser = $rootScope.globals.currentUser? $rootScope.globals.currentUser.data : {};
  $scope.roles = $rootScope.globals.roles? $rootScope.globals.roles : [];

  //when user logs in, receive signal on login
  $scope.$on('login', function () {
    //get all user roles
    UserService.getUserRoles().then(function(response){
      if(response.roles){
        $scope.roles = response.roles;
        //cache user roles
        $rootScope.globals.roles = $scope.roles;
        $cookieStore.put('globals', $rootScope.globals);
      }else{
        $scope.roles = [];
        console.log(response.message);
      }
    });
    $scope.currentUser = $rootScope.globals.currentUser.data;
  });

  //when logout signal is emitted, handle it here
  $rootScope.$on('logout', function () {
    $scope.logout();
  });

  $scope.logout = function () {
    UserService.clearCredentials();
    //go back to sigin page
    $location.path('/');
    $scope.currentUser = null;
  }

 });
