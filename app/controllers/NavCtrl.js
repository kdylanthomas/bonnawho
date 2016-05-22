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

		$scope.authMessage = "Log Out";

		// determines if guest is using site and provides "Register" or "Log Out" message in nav
		let currUser = authenticate.getCurrentUser();
		if (currUser.uid === "23aa05d9-85df-47ab-86dd-a9ab0cbadc19") {
			$scope.authMessage = "Register";
		}

	}
])