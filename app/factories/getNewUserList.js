'use strict';

app.factory('get-new-user-list', function ($q, $http, firebaseURL) {
	// returns a list that contains the artist first added to it
	let getNewUserList = function (searchParam) {
		return $q((resolve, reject) => {
			let url = `${firebaseURL}lists/.json?orderBy="artistToAdd/artistID"&equalTo="${searchParam}"`;
			$http.get(url)
			.success(
				listData => resolve(listData),
				error => reject(error)
			);
		});
	}

	return getNewUserList;
})