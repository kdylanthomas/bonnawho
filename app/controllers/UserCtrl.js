"use strict";

app.controller("UserCtrl", [
	"$scope",
	"authenticate",
	"get-user",
	"firebaseURL",
	"get-artist",
	"$q",
	"$http",
	"get-list",
	"spotify",

	function ($scope, authenticate, getUser, firebaseURL, getArtist, $q, $http, getList, spotify) {

		let user = authenticate.getCurrentUser(); // holds firebase authData object
		let artistToUpdate; // holds unique firebase-generated key for an artist object inside a user's list object
		let list; // holds unique firebase-generated key that corresponds to a user's list

		$scope.populateList = () => { // gets a user's list of saved artists
			$scope.activeIndex = null; // hide details for each artist on list
			$scope.currentUserArtists = []; // initialize w/ empty array
			getUser(user.uid) // get user object from firebase
			.then(
				userData => {
					for (let user in userData) {
						list = userData[user].list; // get user's list key for getList request
					}
					return getList(list);
				},
				err => console.log(err)
			).then(
				list => {
					for (let item in list) {
						$scope.currentUserArtists.push(list[item]); // push each item on list to scoped array
					}
				},
				err => console.log(err)
			)
		}

		$scope.buildListURL = function (artistToUpdate) { // creates ref to artist object inside a user's list
			return $q((resolve, reject) => {
				getList(list)
				.then(
					list => {
						for (let key in list) { // find artist obj in user list that matches the artist info the user is updating
							if (list[key].artistID === artistToUpdate) {
								let listItemURL = `${firebaseURL}lists/${list}/${key}/`; // create ref to artist obj in user list
								return resolve(listItemURL); // function returns ref
							}
						};
					},
					error => reject(error)
				)
			})
		}

		$scope.updateListened = function (id) { // update
			$scope.buildListURL(id)
			.then(
				url => {
					console.log(url);
					let listItemRef = new Firebase(url);
					listItemRef.update({listened: true});
				},
				error => console.log(error)
			)
		}

		$scope.deleteArtist = function (id) { // delete
			$scope.buildListURL(id)
			.then(
				url => {
					console.log(url);
					$http.delete(`${url}.json`)
						.success(
							() => {
								console.log(`you deleted ${artistToUpdate}`);
								$scope.populateList(); // repopulate updated list
							},
							error => console.log(error)
						)
				},
				error => console.log(error)
			)
		}

		// Show or hide list item detail on click
		$scope.showDetail = function (index, id) {
			$scope.hideDetail(); // closes last card before loading any data for new one
			getArtist(id) // firebase GET request
			.then(
				artistData => { // if I add images to database, grab them here (all Firebase info should come here)
					$scope.dayPlaying = artistData.day; // adds day artist is playing to page
					return spotify.searchArtist(artistData.artist); // retrieves Spotify artist ID for future requests
				},
				err => console.log(err)
			).then(
				spotifyData => { // used to retrieve artist's ID for subsequent spotify requests
					console.log('artist', spotifyData.artists.items[0]); // ???: can i move all ID retrieval to factory?
					let id = spotifyData.artists.items[0].id; // grabs ID of artist for future spotify requests
					$scope.artistID = spotifyData.artists.items[0].id;  // save for top tracks href
					showRelatedArtists(id);
					showAlbums(id);
					showTopTracks(id);
					$scope.activeIndex = index; // ???: shouldn't happen here (where should it happen?)
				},
				err => console.log(err)
			)
		}

		let showRelatedArtists = (id) => {
			$scope.relatedArtists = []; // initialize as empty each time a request is made
			spotify.getRelatedArtists(id)
			.then(
				relatedArtists => {
					for (let i = 0; i < 4; i++) { // four related artists
						$scope.relatedArtists.push(relatedArtists.artists[i].name);
					}
					$scope.relatedArtists = $scope.relatedArtists.join(', ');
					console.log('related artists', $scope.relatedArtists);
				},
				err => console.log(err)
			)
		}

		let showAlbums = (id) => {
			$scope.albums = []; // initialize as empty each time a request is made
			spotify.getAlbums(id)
			.then(
				albums => {
					let artistAlbums = albums.items;
					artistAlbums.forEach((album, i) => {
						let currentAlbum = {
							image: "",
							name: "",
							id: ""
						}
						currentAlbum.name = album.name;
						currentAlbum.image = album.images[0].url;
						currentAlbum.id = album.id;
						$scope.albums.push(currentAlbum);
					})
				},
				err => console.log(err)
			)
		}

		let showTopTracks = (id) => {
			$scope.topTracks = [];
			spotify.getTopTracks(id)
			.then(
				tracks => {
					for (let i = 0; i < 3; i++) { // show top three
						let topTrack = {
							name: "",
							uri: "",
							id: ""
						}
						console.log(tracks.tracks);
						topTrack.name = tracks.tracks[i].name;
						topTrack.uri = tracks.tracks[i].uri;
						topTrack.id = tracks.tracks[i].id;
						$scope.topTracks.push(topTrack);
					}
					// embeds top track inside a widget
					// $scope.embedURL = `https://embed.spotify.com/?uri=${tracks.tracks[0].uri}`;
				},
				err => console.log(err)
			)
		}

		$scope.hideDetail = function () {
			$scope.activeIndex = null;
		}

		$scope.isShowing = function (index) {
			return $scope.activeIndex === index;
		}

	}]
)