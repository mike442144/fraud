dbaApp.controller('CompanyCtrl',['$scope','$http','$rootScope','$filter', '$routeParams','$location',function($scope, $http, $rootScope, $filter, $routeParams,$location){
	$rootScope.currentPage = 'company';
	
	$scope.init = function(){
		$http.get('js/mockData/companyInfo.js',{params:{}}).success(function(data){
			if(data.status == 'ok'){
				$scope.companyInfo = data.info;
			}
		});
	};
	
	
	$scope.init();
}]);