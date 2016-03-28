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

		$scope.detailsVisible = false;

		$scope.currArtistDetail = {
			day: "",
			image: "",
			albums: "",
			genres: "",
			relatedArtists: ""
		}

		let getSpotifyData = (artist) => {
			artist = artist.replace(/ /g, '+');
			let spotifyQuery = `q=${artist}&type=artist`;
			$http.get(`https://api.spotify.com/v1/search?${spotifyQuery}`)
			.success(
				data => {
					$scope.smallVictory = data.artists.items[0].images[0].url;
				},
				err => console.log(err)
			)
		}

		$scope.populateList = () => {
			$scope.activeIndex = null;
			$scope.currentUserArtists = [];
			getUser(user.uid)
			.then(
				// get the user's list key
				userData => {
					for (let user in userData) {
						list = userData[user].list;
					}
					// get the list based on the key
					return getList(list);
				},
				err => console.log(err)
			).then(
				list => {
					console.log(list);
					for (let item in list) {
						$scope.currentUserArtists.push(list[item]);
					}
				},
				err => console.log(err)
			)
		}

		$scope.buildListURL = function (artistToUpdate) {
			return $q((resolve, reject) => {
				$http.get(`${firebaseURL}lists/${list}/.json`)
				.success(
					data => {
						// find the object in the list that contains the artist the user wants to update/delete
						for (let key in data) {
							// build URL for the matching artist object inside a user's list
							if (data[key].artistID === artistToUpdate) {
								let listItemURL = `${firebaseURL}lists/${list}/${key}/`;
								return resolve(listItemURL);
							}
						};
					},
					error => reject(error)
				)
			})
		}

		$scope.updateListened = function (event) {
			artistToUpdate = event.target.className;
			$scope.buildListURL(artistToUpdate)
			.then(
				url => {
					console.log(url);
					let listItemRef = new Firebase(url);
					listItemRef.update({listened: true});
				},
				error => console.log(error)
			)
		}

		$scope.deleteArtist = function (id) {
			$scope.buildListURL(id)
			.then(
				url => {
					console.log(url);
					$http.delete(`${url}.json`)
						.success(
							() => {
								console.log(`you deleted ${artistToUpdate}`);
								$scope.populateList();
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
			getArtist(id)
			.then(
				artistData => { // if I add images to database, grab them here
					$scope.currArtistDetail.day = artistData.day; // adds day artist is playing to page
					return spotify.searchArtist(artistData.artist);
				},
				err => console.log(err)
			).then(
				spotifyData => { // used to retrieve artist's ID for subsequent spotify requests
					console.log('artist', spotifyData.artists.items[0]);
					let id = spotifyData.artists.items[0].id; // grabs ID of artist for future spotify requests
					showRelatedArtists(id);
					showAlbums(id);
					$scope.activeIndex = index; //shouldn't happen here
				},
				err => console.log(err)
			)
		}

		let showRelatedArtists = (id) => {
			$scope.relatedArtists = []; // initialize as empty each time a request is made
			spotify.getRelatedArtists(id)
			.then(
				relatedArtists => {
					for (let i = 0; i < 4; i++) {
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

		$scope.hideDetail = function () {
			$scope.activeIndex = null;
		}

		$scope.isShowing = function (index) {
			return $scope.activeIndex === index;
		}

	}]
)