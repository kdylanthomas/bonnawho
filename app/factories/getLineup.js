'use strict';

app.factory("get-lineup", function ($q, $http, firebaseURL) {

	let getLineup = () => {
		return $q(function(resolve, reject) {
			$http.get(`${firebaseURL}artists/.json`)
			.success(
				lineupData => resolve(lineupData),
				error => reject(error)
			);
		});
	}

	return getLineup;

});