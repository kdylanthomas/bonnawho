'use strict';

app.controller("LoginCtrl", [
	'$scope',
	'authenticate',
	'$location',

	function ($scope, authenticate, $location) {

		$scope.user = {
			email: "",
			password: ""
		};

		$scope.register = function (user) {
			const email = user.email;
			const password = user.password;
			authenticate.createUser(email, password)
			.then(
				authData => authenticate.storeUser(authData),
				error => console.log('could not register user')
			).then(
				() => authenticate.loginUser(user.email, user.password),
				error => console.log('could not add user to database')
			).then(
				() => $location.path('/welcome'),
				error => console.log('could not authenticate user')
			)
		}

		$scope.login = function (user) {
			authenticate.loginUser(user.email, user.password)
			.then(
				() => $location.path('/welcome'),
				error => console.log('could not authenticate user')
			);
		}
	}]
);