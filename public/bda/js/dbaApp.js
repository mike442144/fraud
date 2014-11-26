if (typeof $ === 'undefined') { throw new Error('This application\'s JavaScript requires jQuery'); }

var dbaApp = angular.module('dbaApp', ['ngRoute', 'ngAnimate']);

dbaApp.config(['$routeProvider', '$locationProvider',function($routeProvider, $locationProvider){
	//$locationProvider.html5Mode(true);
    $routeProvider.
        when('/step1', {templateUrl:'view/step1.html', controller:'StepOneCtrl'}).
        when('/step2', {templateUrl:'view/step2.html', controller:'StepTwoCtrl'}).
        when('/step3', {templateUrl:'view/step3.html', controller:'StepThreeCtrl'}).
        when('/detail:id', {templateUrl:'view/detail.html', controller:'DetailCtrl'}).
        otherwise({redirectTo:'/step1'})
}]);

dbaApp.run(['$rootScope','$location','$http',function($rootScope,$location,$http){
	//$rootScope.online = true; //配置环境，true为线上环境，false为开发环境
	//$rootScope.mainURl = '';
	
	$rootScope.currentPage = 'step1';
	
	$rootScope.constants = {};
	$rootScope.constants.capitalization = [
		{
			"id":1,
			"text":"options1"
		},
		{
			"id":2,
			"text":"options2"
		},
		{
			"id":3,
			"text":"options3"
		}
	];
	
	$rootScope.constants.dailyTradingVolume = [
		{
			"id":1,
			"text":"options1"
		},
		{
			"id":2,
			"text":"options2"
		},
		{
			"id":3,
			"text":"options3"
		}
	];

}]);

dbaApp.factory('checkboxService', function(){
	return {
		renderCheckedValues: function($allcheckedbox, ngModel){
			var modelValue  = ngModel.$viewValue || [];
			
			$allcheckedbox.attr('checked', false);
			$allcheckedbox.attr('ng-false-value', '');
			angular.forEach(modelValue, function(currentValue){
				$allcheckedbox.filter('[value=' + currentValue + ']').attr('checked', true).attr('ng-true-value',currentValue);
			});
		},
		setCheckedValuesToModel: function($allcheckedbox, ngModel, scope, isNumber){
			var checkedValues = $allcheckedbox.filter(':checked').map(function(){
					return isNumber === 'true' ? Number($(this).val()) : $(this).val();
				}).get();

			scope.$apply(function(){
				ngModel.$setViewValue(checkedValues);
			});
		}
	};
});

dbaApp.directive('uiSlider', function() {
  return {
    restrict: 'A',
    controller: function($scope, $element) {
      var $elem = $($element);
      if($.fn.slider)
        $elem.slider();
    }
  };
});

dbaApp.directive('checkboxcontainer', function($timeout, checkboxService, checkboxConstants){
	return {
		restrict: 'EA',
		require: '?ngModel',
		link: function(scope, el, attrs, ngModel){
			//view => model
			el.find('.js_checkbox').on('click', function(){
				checkboxService.setCheckedValuesToModel(el.find('.js_checkbox'), ngModel, scope, attrs.isNumber);
			});

			//model => view
			ngModel.$render = function(){
				if(attrs.waitDataReady){
					scope.$on(checkboxConstants.dataReadyMessage, function(){
						checkedCheckbox();
					});
				}else{
					checkedCheckbox();
				}
			};
			
			scope.$watch(attrs.ngModel, function(){
				checkedCheckbox();
			}, true);

			function checkedCheckbox(){
				$timeout(function(){
					checkboxService.renderCheckedValues(el.find('.js_checkbox'), ngModel);
				}, 50);
			}
		}
	};
}).constant('checkboxConstants', {
	dataReadyMessage: 'dataReady'
});
