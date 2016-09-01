angular.module('app.services', [])


.service('AuthService', function($http, $q, API_URL) {
    this.register = function(){
        var deferred = $q.defer(),
            AuthService = this;
        $http.post(API_URL + "/auth/signup")
        .success(function(data) {
            console.log(data);
            AuthService.saveUser(data);            
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    };
    
    
    this.userIsLoggedIn = function(){
        var deferred = $q.defer(),  
            AuthService = this,
            user = AuthService.getUser();
        if (user){
            deferred.resolve(user);           
        }
        else{
            deferred.reject("No user saved");
        }
        return deferred.promise;
    }
    this.saveUser = function(user){
        window.localStorage.ba_user = JSON.stringify(user);
    };

    this.getUser = function(){
        var data = window.localStorage.ba_user ? JSON.parse(window.localStorage.ba_user) : null;
        return data;
    };  
    
    this.removeUser = function(){
        window.localStorage.ba_user = null;
    } 

    
    
    this.logout = function(){ 
        var AuthService = this;
        AuthService.removeUser();
    }
})


.service('MainService', function($http, $q, API_URL, AuthService) {
    
    this.getBeacons = function(){
        var deferred = $q.defer(),
            user = AuthService.getUser();
        if (!user){deferred.reject("No token");}   
        $http.get(API_URL + "/beaconsapp?token=" + user.token)
        .success(function(data) {
            console.log(data);
                      
            deferred.resolve(data.beacons);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    };    
    
    
    this.getAdverts = function(beacon){
        var deferred = $q.defer(),
            user = AuthService.getUser();
        if (!user){deferred.reject("No token");}   
        $http.get(API_URL + "/adverts?token=" + user.token)
        .success(function(data) {
            console.log(data);
                      
            deferred.resolve(data.adverts);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    };
    
    this.getAdvert = function(beacon){
        var deferred = $q.defer(),
            user = AuthService.getUser();
        if (!user){deferred.reject("No token");}   
        $http.get(API_URL + "/advertsapp?token=" + user.token + "&uuid=" + beacon.uuid + "&major=" + beacon.major + "&minor=" + beacon.minor)
        .success(function(data) {
            console.log(data);
                      
            deferred.resolve(data.advert);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    };    
    
    this.getRecords = function(){
        var deferred = $q.defer(),
            user = AuthService.getUser();
        if (!user){deferred.reject("No token");}   
        $http.get(API_URL + "/records?token=" + user.token)
        .success(function(data) {
            console.log(data);
                      
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    };  
    
    this.saveRecord = function(record){
        var deferred = $q.defer(),
            user = AuthService.getUser();
        if (!user){deferred.reject("No token");}   
        $http.post(API_URL + "/records/store?token=" + user.token, record)
        .success(function(data) {
            console.log(data);
                      
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    };     
});
