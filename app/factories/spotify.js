app.factory("spotify", function ($q, $http) {
	// build out to include all spotify requests
	let searchArtist = (artist) => {
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

	let getRelatedArtists = (id) => {
		return $q((resolve, reject) => {
			$http.get(`https://api.spotify.com/v1/artists/${id}/related-artists`)
			.success(
				relatedArtists => resolve(relatedArtists),
				err => console.log(err)
			)
		})
	}

	let getAlbums = (id) => {
		return $q((resolve, reject) => {
			$http.get(`https://api.spotify.com/v1/artists/${id}/albums?market=US&album_type=album`)
			.success(
				albums => resolve(albums),
				err => console.log(err)
			)
		})
	}

	let getTopTracks = (id) => {
		return $q((resolve, reject) => {
			$http.get(`https://api.spotify.com/v1/artists/${id}/top-tracks?country=US`)
			.success(
				tracks => resolve(tracks),
				err => console.log(err)
			)
		})
	}

	let Spotify = {searchArtist, getRelatedArtists, getAlbums, getTopTracks};
	return Spotify;

})
