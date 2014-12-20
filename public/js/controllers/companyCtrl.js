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
	
	$scope.$on('toParentCtrl', function(d,data) {  
        $scope.$apply(function(){
			$scope.companyInfo.UploadedFiles.push(data.data);
		});
		
    });  
}]);