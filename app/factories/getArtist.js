"use strict";

app.factory("get-artist", function ($q, $http, firebaseURL) {

	let getArtist = function (artist) {
		return $q((resolve, reject) => {
			$http.get(`${firebaseURL}artists/${artist}/.json`)
			.success(
				artistData => resolve(artistData),
				error => reject(error)
			)
		})
	}

	return getArtist;
})