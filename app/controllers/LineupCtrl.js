"use strict";

app.controller("LineupCtrl", [
	"$scope",
	"get-lineup",
	"authenticate",
	"get-user",
	"$http",
	"firebaseURL",
	"get-new-user-list",
	"get-artist",

	function ($scope, getLineup, authenticate, getUser, $http, firebaseURL, getNewUserList, getArtist) {

		let user = authenticate.getCurrentUser();
		let currentUserData;
		let list;
		let chosenArtist = "";

		let artistToAdd = {
			artistID: "",
			artistName: "",
			listened: false,
			rating: 0,
			comments: ""
		}

		// store a user's already-added artists--get this data immediately after getting lineup data
		$scope.userSavedArtists = [];

		$scope.getArtistsOnList = () => {
			if (list) {
				console.log(`${firebaseURL}lists/${list}`);
				let ref = new Firebase(`${firebaseURL}lists/${list}`);
				// this returns each artist key that has been added to a user's list
				ref.orderByChild('name').on('child_added', function (snapshot) {
					let currentArtist = snapshot.val().artistName;
					$scope.userSavedArtists.push(currentArtist);
				});
			} else {
				$scope.userSavedArtists = [];
			}
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

		getUser(user.uid)
		.then(
			userData => {
				for (let key in userData) {
					list = userData[key].list;
					return getLineup();
				}
			},
			err => console.log(err)
		)
		// Get lineup from mock API & output to DOM as $scope.lineup

		.then(
			lineupData => {
				$scope.lineup = convertObjToArray(lineupData);
				$scope.getArtistsOnList();
			},
			error => console.log(error)
		);

		// when user clicks "add", build out an artist obj to add based on event target ID
		$scope.buildArtistObject = function (event, index) {
			// $scope.lineup[index].addedByUser = true;
			chosenArtist = event.target.id;
			artistToAdd.artistID = chosenArtist;
			getArtist(chosenArtist)
			.then(
				data => artistToAdd.artistName = data.artist,
				err => console.log(err)
			);
			// after artist object is constructed, find current user's list
			$scope.findUserList();
		}


		$scope.findUserList = function () {
			// request user data each time list needs to be found, to account for list updates
			getUser(user.uid)
			.then(
				userData => {
					currentUserData = userData;
					for (let key in currentUserData) {
						// if user has a list, assign their list ID to the list variable
						if (currentUserData[key].list) {
							list = currentUserData[key].list;
						} else {
							console.log('no list exists for ' + currentUserData[key].uid);
							list = null;
						}
						// once list is defined (or not found), add artist to that list
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
				// post object to lists data (this creates a new list object)
				$http.post(`${firebaseURL}lists/.json`, {artistToAdd})
				.then(
					// use the search param to get the list containing the most recently added artist
					() => {
						$scope.alreadyAdded = true;
						getNewUserList(searchParam);
					},
					error => console.log(error)
				).then(
					listData => {
						// grab key associated with a user's list and pass it into assignList fn
						for (let key in listData) {
							list = key;
						}
						// assign user their list: (accounts for multiple users adding same artist first)
						// only assign list based on last object in listData, which is the most recently added one
						assignListToUser(list);
					},
					error => console.log('error', error)
				)
			// *** IF USER HAS EXISTING LIST:
			} else {
				$http.post(`${firebaseURL}lists/${list}/.json`, artistToAdd)
				.success(
					data => $scope.alreadyAdded = true,
					error => console.log(error)
				)
			console.log(list);
			}
		}

		// attaches list ID as property of a user
		let assignListToUser = function (listID) {
			for (let key in currentUserData) {
				let userRef = new Firebase(`${firebaseURL}users/${key}`);
				userRef.update({list: listID});
			}
		}

		// uses stored array of user's saved artists to disable "add" buttons of artists already added
		$scope.checkAgainstUserList = function (artistName) {
			$scope.alreadyAdded = false;
			console.log(artistName);
			let arr = $scope.userSavedArtists;
			arr.forEach((el, i) => {
				if (el === artistName) {
					$scope.alreadyAdded = true;
				}
			})
		}

		$scope.sortByHeadliners = () => {
			$scope.lineup.sort(function (obj1, obj2) {
				return obj1.billing - obj2.billing;
			})
		}

		$scope.sortAtoZ = () => {
			getLineup()
			.then(
				data => $scope.lineup = convertObjToArray(data),
				err => console.log(err)
			)
		}

	}]
);