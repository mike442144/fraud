dbaApp.controller('StepOneCtrl',['$scope','$http','$rootScope','$filter', '$routeParams','$location',function($scope, $http, $rootScope, $filter, $routeParams,$location){
	$rootScope.currentPage = 'step1';
	
	//初始化获取所有的companylist
	$scope.init = function(){
		$http.get('js/mockData/companyList.js',{params:{}}).success(function(data){
			if(data.status == 'ok'){
				$scope.companyList = data.lists;
			}
		});
	};
	
	$scope.init();
	
	function getCompanyDetail(listId,compareListId){
		//发ajax请求，获取数据详情
		$http.get('js/mockData/companyDetailList.js',{params:{}}).success(function(data){
			if(data.status == 'ok'){
				$scope.companyDetailList = data.lists;
			}
		});
	}
	
	//事件相关
	//点击行
	$scope.clickTr = function(list){
		$scope.checkedId = list.id;
		$scope.compareId = null;
		
		getCompanyDetail($scope.checkedId);
	};
	
	//点击compare按钮
	$scope.compare = function(list,$event){
		$scope.compareId = list.id;
		$event.stopPropagation();
		
		getCompanyDetail($scope.checkedId,$scope.compareId);
		
	};
	
	//在行上浮动时 出现按钮（动画有延时）
	$scope.showCompare = function(list){
		$scope.hoverId = list.id;
	};
	
	$scope.hideCompare = function(){
		$scope.hoverId = null;
	};
	
	$scope.goNext = function(){
		$location.path('/step2');
	};
	
}]);