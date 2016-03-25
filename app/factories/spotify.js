app.factory("spotify", function ($q, $http) {
	// build out to include all spotify requests
	let getArtist = function (artist) {
		return $q((resolve, reject) => {
			artist = artist.replace(/ /g, '+');
			let query = `q=${artist}&type=artist`;
			$http.get(`https://api.spotify.com/v1/search?${query}`)
			.success(
				data => resolve(data),
				err => reject(err)
			)
		})
	}

	return getArtist;
})
