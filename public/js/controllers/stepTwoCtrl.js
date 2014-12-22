dbaApp.controller('StepTwoCtrl',['$scope','$http','$rootScope','$filter', '$routeParams','$location','$timeout',function($scope, $http, $rootScope, $filter, $routeParams,$location,$timeout){
    $rootScope.currentPage = 'step2';
	
	$scope.currentTplInfo = {
		"tplname":"",
		"content":{
			"fraudCompany":"1",
			"affiliations":"1",
			"marketCapitalization":"",
			"dailyTradingVolume":"",
			"suspiciousAuditor":"",
			"suspiciousFinancialAdvisor":"",
			"legalAdvisor":"",
			"shortSellable":"",
			"reputableCompany":"",
			"exchange":[]
		},
		"saved":false,
		"createdAt":"",
		"updatedAt":""
	};
	
	//初始化 获取所有的已有模板的信息  js/mockData/templateList.js
	$scope.init = function(){
		$http.get('/template',{params:{}}).success(function(data){
			if(data.success === true){
				$scope.templateList = data.data;
			}
		});
	};
	
	$scope.init();
	
	function transforCheckValue(value){
		if(value === true){
			return 1;
		}else{
			return 0;
		}
	}
	
	//处理模板数据(提交时)
	function transforTplParamsToSubmit(obj){
		obj.content.suspiciousAuditor = transforCheckValue(obj.content.suspiciousAuditor);
		obj.content.suspiciousFinancialAdvisor = transforCheckValue(obj.content.suspiciousFinancialAdvisor);
		obj.content.legalAdvisor = transforCheckValue(obj.content.legalAdvisor);
		obj.content.shortSellable = transforCheckValue(obj.content.shortSellable);
		obj.content.reputableCompany = transforCheckValue(obj.content.reputableCompany);
		
		delete obj.createdAt;
		delete obj.updatedAt;

		return obj;
	}

	//点击某一个模板时，获取那个模板信息
	$scope.selectTpl = function(list){
					  if(!$scope.currentTplInfo || ($scope.currentTplInfo && $scope.currentTplInfo.id != list.id)){
																       $scope.currentTplInfo = angular.copy(list);
																      }else{
																	    $scope.currentTplInfo = {
																				     "tplname":"",
																				     "content":{
																						"fraudCompany":"1",
																						"affiliations":"1",
																						"marketCapitalization":"",
																						"dailyTradingVolume":"",
																						"suspiciousAuditor":"",
																						"suspiciousFinancialAdvisor":"",
																						"legalAdvisor":"",
																						"shortSellable":"",
																						"reputableCompany":"",
																						"exchange":[]// 复选框赋值时需要默认是数组，不然第二次赋值会报错
																					       },
																				     "saved":false,
																				     "createdAt":"",
																				     "updatedAt":""
																				    };
																	   }
					 };
	
	
	
	$scope.saveTpl = function(bool){
		var obj = transforTplParamsToSubmit(angular.copy($scope.currentTplInfo));
		obj.saved = bool;
	    
		$http({
			method:'POST', 
			url: '/compute', 
		    data: JSON.stringify({setid:$routeParams.setid,tpl:obj}), 
			headers : {
				'Content-Type' : 'application/json'
			}
		}).success(function(data, status, headers, config){
			if(data.success === true ){
				$location.path('/step3');
			}else{
				alert('保存失败，请重试！');
			}
		});
	};
	
	
}]);