'use strict';

app.factory('get-user', function ($q, $http, firebaseURL) {
	let getUser = (uid) => {
		return $q((resolve, reject) => {
			$http.get(`${firebaseURL}users/.json?orderBy="uid"&equalTo="${uid}"`)
			.success(
				artistData => resolve(artistData),
				error => reject(error)
			);
		});
	}

	return getUser;
})


