'use strict';

app.factory('get-list', function ($q, $http, firebaseURL) {
	// returns a list that contains the artist first added to it
	let getList = function (searchParam) {
		return $q((resolve, reject) => {
			let url = `${firebaseURL}lists/.json`;
			if (searchParam) {
				url += `?orderBy="artistToAdd/name"&equalTo="${searchParam}"`;
			}
			console.log(url);
			$http.get(url)
			.success(
				listData => resolve(listData),
				error => reject(error)
			);
		});
	}

	return getList;
})