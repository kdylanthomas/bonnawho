app.controller("ArtistDetailCtrl", [
	"$scope",
	"conduit",
	"get-artist",
	"$http",

	function ($scope, conduit, getArtist, $http) {

		$scope.artistToDisplay;

		$scope.smallVictory;

		$scope.$watch(
			function () {
				return conduit.getSearchParams()
			},
			function (newVal, oldVal) {
				artistToSearch = newVal;
				getArtist(newVal)
				.then(
					artistData => {
						let artist = artistData.artist;
						console.log(artist);
						if (!artist) {
							return;
						} else {
							artist = artist.replace(/ /g, '+');
							let spotifyQuery = `q=${artist}&type=artist`;
							getSpotifyData(spotifyQuery);
						}
					},
					err => console.log(err)
				)
			}
		)

		let getSpotifyData = (query) => {
			$http.get(`https://api.spotify.com/v1/search?${query}`)
			.success(
				data => {
					$scope.smallVictory = data.artists.items[0].images[0].url;
				},
				err => console.log(err)
			)
		}

	}]
)