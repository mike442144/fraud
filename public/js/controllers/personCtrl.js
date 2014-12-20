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
	
    $scope.$on('toParentCtrl', function(d,data) {  
        $scope.$apply(function(){
			$scope.personInfo.UploadedFiles.push(data.data);
		});
    });  
    
    $scope.init();
    
}]);