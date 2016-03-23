app.controller('NavCtrl', [
	"$scope",
	"authenticate",
	"$location",

	function ($scope, authenticate, $location) {
		$scope.logout = () => {
			authenticate.logoutUser();
		}

		$scope.checkPath = () => {
			$scope.path = $location.path();
		}
	}
])