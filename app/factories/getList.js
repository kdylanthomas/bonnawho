'use strict';

app.factory('get-list', function ($q, $http, firebaseURL) {
	// returns a list that contains the artist first added to it
	let getList = function (list) {
		return $q((resolve, reject) => {
			let url = `${firebaseURL}lists`;
			if (list) {
				url += `/${list}`;
			}
			$http.get(`${url}/.json`)
			.success(
				listData => resolve(listData),
				error => reject(error)
			);
		});
	}

	return getList;
})