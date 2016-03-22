"use strict";

app.controller("LineupCtrl", [
	"$scope",
	"get-lineup",
	"authenticate",
	"get-user",
	"$http",
	"firebaseURL",
	"get-list",

	function ($scope, getLineup, authenticate, getUser, $http, firebaseURL, getList) {

		let user = authenticate.getUser();
		let currentUserData;
		let chosenArtist = "";

		let artistToAdd = {
			name: "",
			listened: false,
			rating: 0
		}

		// Convert data to array and return array--will define $scope.lineup && $scope.users
		let convertObjToArray = (obj) => {
			let arr = [];
			for (let key in obj) {
				obj[key].key = key;
				arr.push(obj[key]);
			}
			return arr;
		}

		// Get lineup from mock API
		getLineup()
		.then(
			lineupData => {
				$scope.lineup = convertObjToArray(lineupData);
			},
			error => console.log(error)
		);

		// when user clicks "add", build out an artist obj to add based on event target ID
		$scope.buildArtistObject = function (event) {
			chosenArtist = event.target.id;
			artistToAdd.name = chosenArtist;
			// next, see if there is a list to add this artist to
			// ?? is it ideal to keep passing this artistToAdd obj down several functions?
			$scope.findUserList();
		}

		$scope.findUserList = function () {
			let list;
			// request user data each time list needs to be found, to account for new users
			getUser(user.uid)
			.then(
				userData => {
					currentUserData = userData;
					for (let key in currentUserData) {
						// if so, assign their list ID to the list variable; if not, let list = null
						if (currentUserData[key].list) {
							list = currentUserData[key].list;
						} else {
							console.log('no list exists for ' + currentUserData[key].uid);
							list = null;
						}
						$scope.addArtistToList(list);
					}
				},
				error => console.log(error)
			)
		}

		$scope.addArtistToList = function (list) {
			// store search param to indirectly access a user's new list after it has been created
			let searchParam = artistToAdd.name;
			// *** IF USER DOES NOT YET HAVE A LIST (i.e. this is the user's first artist addition):
			if (!list) {
				// post object to lists table (this creates a new list object)
				// first artist added will be named artistToAdd...is this fine?
				$http.post(`${firebaseURL}lists/.json`, {artistToAdd})
				.then(
					// use the search param to get the list that the artist was just added to
					// !! will this be a problem in the future, e.g. if two users add the same artist first?
					() => getList(searchParam),
					error => console.log(error)
				)
				.then(
					listData => {
						// grab key associated with a user's list and pass it into assignList fn
						for (let key in listData) {
							list = key;
						}
						// only assign list based on last object in listData, which should be most recently added one
						assignListToUser(list);
					},
					error => console.log('error', error)
				)

			// *** IF USER HAS EXISTING LIST:
			} else {
				// post artist to their list
				$http.post(`${firebaseURL}lists/${list}/.json`, artistToAdd)
				.success(
					data => console.log(data),
					error => console.log(error)
				)
				console.log(list);
			}
		}

		let assignListToUser = (listID) => {
			for (let key in currentUserData) {
				let userRef = new Firebase(`${firebaseURL}users/${key}`);
				userRef.update({list: listID});
			}
		}

		// currently disables click only for most recently added artist
		$scope.isClicked = function (index, artist) {
			if (chosenArtist === artist.key) {
				return true;
			} else {
				return false;
			}
		}

	}]
);