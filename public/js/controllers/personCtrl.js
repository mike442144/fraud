dbaApp.controller('PersonCtrl',['$scope','$http','$rootScope','$filter', '$routeParams','$location',function($scope, $http, $rootScope, $filter, $routeParams,$location){
    $rootScope.currentPage = 'person';
    
    //js/mockData/personInfo.js
    $scope.init = function(){
	$http.get('/person/'+$routeParams.personid,{params:{id:$routeParams.personid}}).success(function(data){
	    if(data.success === true){
		$scope.personInfo = data.data;
	    }
	});
    };
	
    $scope.$on('toParentCtrl', function(d,responseData) {
        $scope.$apply(function(){
	    //responseData
	    var obj = responseData.data;
	    obj.target = 2;
	    obj.personid=$routeParams.personid;
	    $http({
		method:'POST',
		url: '/addfile',
		data: JSON.stringify(obj),
		headers : {
		    'Content-Type' : 'application/json'
		}
	    }).success(function(data, status, headers, config){
		console.log(data);
		$scope.personInfo.UploadedFiles.push(data.data);
	    });
	});
    });  
    
    $scope.init();
    
}]);