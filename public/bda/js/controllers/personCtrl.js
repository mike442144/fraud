dbaApp.controller('PersonCtrl',['$scope','$http','$rootScope','$filter', '$routeParams','$location',function($scope, $http, $rootScope, $filter, $routeParams,$location){
	$rootScope.currentPage = 'person';
	
	
	$scope.init = function(){
		$http.get('js/mockData/personInfo.js',{params:{}}).success(function(data){
			if(data.status == 'ok'){
				$scope.personInfo = data.info;
			}
		});
	};
	
	
	$scope.init();
	
}]);