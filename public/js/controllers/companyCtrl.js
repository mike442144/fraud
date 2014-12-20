dbaApp.controller('CompanyCtrl',['$scope','$http','$rootScope','$filter', '$routeParams','$location',function($scope, $http, $rootScope, $filter, $routeParams,$location){
	$rootScope.currentPage = 'company';
	//js/mockData/companyInfo.js
	$scope.init = function(){
		$http.get('/company/'+$routeParams.companyid,{params:{companyid:$routeParams.companyid}}).success(function(data){
			if(data.success === true){
				$scope.companyInfo = data.data;
			}
		});
	};
	
    
    $scope.init();
    
    $scope.$on('toParentCtrl', function(d,responseData) {
        $scope.$apply(function(){
	    var obj = responseData.data;
	    obj.target=1;
	    obj.companyid=$routeParams.companyid;
	    
	    $http({
		method:'POST',
		url: '/addfile',
		data: JSON.stringify(obj),
		headers : {
		    'Content-Type' : 'application/json'
		}
	    }).success(function(data, status, headers, config){
		$scope.companyInfo.UploadedFiles.push(obj);
	    });
	});
    });  
}]);