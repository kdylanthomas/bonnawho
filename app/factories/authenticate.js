"use strict";

app.factory('authenticate', function (firebaseURL, $q, $http) {

	let ref = new Firebase(firebaseURL);

	let currentUserData = null;

	let Authenticate = {};

	Authenticate.isAuthenticated = () => {
		let authData = ref.getAuth();
		if (!authData) {
			return false;
		} else {
			currentUserData = authData;
			return true;
		}
	}

	Authenticate.getCurrentUser = () => {
		return currentUserData;
	}

	Authenticate.createUser = (user, pass) => {
		return $q((resolve, reject) => {
			return ref.createUser({
			  email    : user,
			  password : pass
			}, function(error, userData) {
			  if (error) {
			    console.log("Error creating user:", error);
			  } else {
			    console.log("Successfully created user account with uid:", userData.uid);
			    return resolve(userData);
			  }
			});
		});
	}

	Authenticate.loginUser = (user, pass) => {
		return $q(function(resolve, reject) {
			ref.authWithPassword({
			  email    : user,
			  password : pass
			}, function(error, authData) {
			  if (error) {
			    console.log("Login Failed!", error);
			  } else {
			    console.log("Authenticated successfully with payload:", authData);
			    return resolve(authData);
			  }
			},
		  {
		 	 remember: "sessionOnly"
			});
		});
	}

	// add user to users object upon registering
	Authenticate.storeUser = (authData) => {
		let stringifiedUser = JSON.stringify({ uid: authData.uid });
		console.log('adding ' + stringifiedUser + ' to database');
		return $q((resolve, reject) => {
			$http.post(`${firebaseURL}/users.json`, stringifiedUser)
			.then(
				data => {
					console.log('data', data);
					resolve(data);
				},
				error => reject(error)
			);
		});
	}

	Authenticate.logoutUser = () => ref.unauth()

	return Authenticate;

});