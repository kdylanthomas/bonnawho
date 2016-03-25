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

	function ($scope, authenticate, getUser, firebaseURL, getArtist, $q, $http, getList) {

		let user = authenticate.getCurrentUser(); // holds firebase authData object
		let artistToUpdate; // holds unique firebase-generated key for an artist object inside a user's list object
		let list; // holds unique firebase-generated key that corresponds to a user's list

		$scope.detailsVisible = false;

		$scope.currArtistDetail = {
			day: "",
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
			getArtist(id)
			.then(
				artistData => {
					console.log(artistData);
					$scope.currArtistDetail.day = artistData.day;
					$scope.activeIndex = index;
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