dbaApp.controller('StepTwoCtrl',['$scope','$http','$rootScope','$filter', '$routeParams','$location',function($scope, $http, $rootScope, $filter, $routeParams,$location){
	$rootScope.currentPage = 'step2';
	
	//初始化 获取所有的已有模板的信息
	$scope.init = function(){
		$http.get('js/mockData/templateList.js',{params:{}}).success(function(data){
			if(data.status == 'ok'){
				$scope.templateList = data.lists;
				$scope.$broadcast('dataReady');
			}
		});
	};
	
	$scope.init();
	
	//点击某一个模板时，获取那个模板信息
	$scope.selectTpl = function(list){
		if(!$scope.currentTplInfo || ($scope.currentTplInfo && $scope.currentTplInfo.id != list.id)){
			$scope.currentTplInfo = list;
			
			$scope.$broadcast('dataReady');
		}else{
			$scope.currentTplInfo = null;
		}
		
		
	};
	
	$scope.saveTpl = function(){
		var obj = angular.copy($scope.currentTplInfo);
		
		$http({method:'POST', url: '', data: '', headers : {
			'Content-Type' : 'application/x-www-form-urlencoded'
		}}).success(function(data, status, headers, config){
			if(data.status === 'ok' ){
				$location.path('/step3');
			}else{
				alert('保存失败，请重试！');
			}
		});
	};
	
	
}]);