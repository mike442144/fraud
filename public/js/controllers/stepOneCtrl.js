dbaApp.controller('StepOneCtrl',['$scope','$http','$rootScope','$filter', '$routeParams','$location',function($scope, $http, $rootScope, $filter, $routeParams,$location){
	$rootScope.currentPage = 'step1';
	
	//初始化获取所有的  /companyset
	$scope.init = function(){
	    //js/mockData/companyList.js
		$http.get('/companyset',{params:{}}).success(function(data){
			if(data.success === true){
				$scope.companyList = data.data;
			}
		});
	};
	
	//初始化页面
	$scope.init();
	
	//点击行
	$scope.clickTr = function(list){
		$scope.checkedId = list.setid;
		$scope.compareId = null;
		
		//发ajax请求，获取数据详情 js/mockData/companyDetailList.js
		$http.get('/companyset/'+$scope.checkedId,{params:{id:$scope.checkedId}}).success(function(data){
			if(data.success === true){
				$scope.companyDetailList = data.data;
			}
		});
		
	};
	
	//点击compare按钮
	$scope.compare = function(list,$event){
		$scope.compareId = list.setid;
		$event.stopPropagation();
		
	    //发ajax请求，获取两个数据比较后的结果  js/mockData/companyDetailList.js
		$http.get('/compare',{params:{selectedId:$scope.compareId,curId:$scope.compareId}}).success(function(data){
			if(data.success === true){
				$scope.companyDetailList = data.data;//回来的结果和选中一行时共用一个model
			}
		});
		
	};
	
	//在行上浮动时 出现按钮
	$scope.showCompare = function(list){
		$scope.hoverId = list.setid;
	};
	
	//鼠标移开时，隐藏按钮
	$scope.hideCompare = function(){
		$scope.hoverId = null;
	};
	
	//点击下一步，需要做一步是否选择了某一家公司
	$scope.goNext = function(){
		if(!$scope.checkedId){
			alert('Choose a Fraund company set first');
			return false;
		}
		
		$location.path('/step2/'+$scope.checkedId);//（这里是不是应该带参数过去？）
	};
	
}]);