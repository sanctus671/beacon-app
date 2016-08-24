// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.services'])

.run(function($ionicPlatform, $rootScope, AuthService) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    
    $rootScope.devicePlatform = ionic.Platform.platform();

    AuthService.userIsLoggedIn().then(function(response){
        

    },function(response){
        //reregister user
        AuthService.register();
    });     

  
    $ionicPlatform.on("resume", function(){ 
        AuthService.userIsLoggedIn().then(function(){
            
        },function(){
            //reregister user
            AuthService.register();
        });
    });    
    
    
    
    
  });
  
    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){ // UI Router Authentication Check
      if (toState.data.authenticate){
          AuthService.userIsLoggedIn().then(function(response){
              
          },function(){
              //reregister user
              AuthService.register();
          });
      }

    });  

    $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams){ // UI Router Authentication Check
        
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.close();
        }        

    });    
  
  
  
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.notifications', {
    url: '/notifications',
    views: {
      'tab-notifications': {
        templateUrl: 'templates/tab-notifications.html',
        controller: 'NotificationsCtrl'
      }
    },
    data: {
      authenticate: true
    }    
  })



  .state('tab.drag', {
    url: '/drag',
    views: {
      'tab-drag': {
        templateUrl: 'templates/tab-drag.html',
        controller: 'DragCtrl'
      }
    },
    data: {
      authenticate: true
    } 
  })
  
  .state('tab.collection', {
    url: '/collection',
    views: {
      'tab-collection': {
        templateUrl: 'templates/tab-collection.html',
        controller: 'CollectionCtrl'
      }
    },
    data: {
      authenticate: true
    } 
    })
  
    
    
    
    ;
  
  

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/drag');

});
