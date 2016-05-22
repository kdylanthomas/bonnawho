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
	"spotify",

	function ($scope, getLineup, authenticate, getUser, $http, firebaseURL, getNewUserList, getArtist, spotify) {

		let user = authenticate.getCurrentUser(); // holds firebase authData object
		let currentUserData;
		let list; // holds unique firebase-generated key that corresponds to a user's list
		let chosenArtist = "";

		// empty object template for adding an artist to a user list
		let artistToAdd = {
			artistID: "",
			artistName: "",
			listened: false,
			rating: 0,
			day: "",
			start: "",
			end: "",
			comments: ""
		}

		// Convert data to array and return array--used to define $scope.lineup && $scope.users
		let convertObjToArray = (obj) => {
			let arr = [];
			for (let key in obj) {
				obj[key].key = key;
				arr.push(obj[key]);
			}
			return arr;
		}

		// ***********************
		// INITIAL POPULATE PAGE
		// ***********************

		getUser(user.uid) // first, get data for user currently logged in
		.then(
			userData => {
				for (let key in userData) {
					list = userData[key].list; // then, define their list by its key
					return getLineup(); // after getting userData, get lineupData
				}
			},
			err => console.log(err)
		).then( // get lineup from firebase & output to DOM as $scope.lineup
			lineupData => {
				$scope.lineup = convertObjToArray(lineupData);
				$scope.getArtistsOnList(); // find which artists the user has already added
			},
			error => console.log(error)
		);


		// store a user's already-added artists, if there are any
		$scope.userSavedArtists = [];
		$scope.getArtistsOnList = () => {
			if (list) {
				let ref = new Firebase(`${firebaseURL}lists/${list}`);
				// returns each artist key that has been added to a user's list
				ref.orderByChild('name').on('child_added', function (snapshot) {
					let currentArtist = snapshot.val().artistName;
					$scope.userSavedArtists.push(currentArtist);
				});
			} else {
				$scope.userSavedArtists = [];
			}
		}

		// ***********************
		// ADDING ARTISTS TO LIST
		// ***********************

		// when user clicks "add", update properties on the artistToAdd obj
		$scope.buildArtistObject = function (chosenArtist, index) {
			artistToAdd.artistID = chosenArtist;
			getArtist(chosenArtist)
			.then(
				data => {
					artistToAdd.artistName = data.artist;
					artistToAdd.day = data.day;
					artistToAdd.start = data.start;
					artistToAdd.end = data.end;
					$scope.findUserList(); // after getting all data from firebase, find current user's list
				},
				err => console.log(err)
			);
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
							list = null; // if user does not have a list, let it be null until defined
						}
						$scope.addArtistToList(list); // once list is defined (or null), add artist to that list
					}
				},
				error => console.log(error)
			)
		}

		$scope.addArtistToList = function (list) {
			// finds a user's list indirectly, based on the first artist they added to their list
			let searchParam = artistToAdd.artistID;
			if (!list) { // *** IF USER DOES NOT YET HAVE A LIST (this is the user's first artist addition):
				// post artist object to lists (this creates a new list object)
				$http.post(`${firebaseURL}lists/.json`, {artistToAdd})
				.then(
					() => {
						$scope.alreadyAdded = true;
						return getNewUserList(searchParam); // get the list created by the new user, based on the artist added
					},
					error => console.log(error)
				).then(
					listData => {
						for (let key in listData) {
							list = key; // find key associated with list
						}
						assignListToUser(list); // assign list as property of current user in firebase
					},
					error => console.log('error', error)
				)
			// *** IF USER HAS EXISTING LIST (they have added artists before):
			} else {
				$http.post(`${firebaseURL}lists/${list}/.json`, artistToAdd)
				.success(
					data => $scope.alreadyAdded = true,
					error => console.log(error)
				)
			}
		}

		// updates new user object in firebase with their list ID as a property
		let assignListToUser = function (listID) {
			for (let key in currentUserData) {
				let userRef = new Firebase(`${firebaseURL}users/${key}`);
				userRef.update({list: listID});
			}
		}

		// ***********************
		// PREVENT DUPE ADDITIONS
		// ***********************

		// uses stored array of user's saved artists to disable "add" buttons of artists already added
		$scope.checkAgainstUserList = function (artistName) {
			$scope.alreadyAdded = false;
			let arr = $scope.userSavedArtists;
			arr.forEach((el, i) => {
				if (el === artistName) {
					$scope.alreadyAdded = true;
				}
			})
		}

		// ***********************
		// SURPRISE BUTTON
		// ***********************

		$scope.getRandomArtist = () => {
			let min = 0;
			let max = $scope.lineup.length;
			let randomNum = Math.floor(Math.random() * (max - min + 1)) + min; // find random artist in lineup by index
			let key = $scope.lineup[randomNum].key;
			let name = $scope.lineup[randomNum].artist;
			$scope.checkAgainstUserList(name); // see if artist has been added by user already
			$(`#modal--${key}`).modal("show"); // open modal for random artist
		}

		// ***********************
		// SORTING & FILTERING
		// ***********************

		$scope.chosenFilter = 'billing'; // set default filter to headliners first

		$scope.changeFilter = function (filter, day) {
			if (day) {
				$scope.selectedDay = day;
			} else {
				$scope.selectedDay = "";
			}
			return $scope.chosenFilter = filter;
		}

	}]
);