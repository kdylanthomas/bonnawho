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

		let user = authenticate.getCurrentUser();
		let currentUserData;
		let list;
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

		// Get lineup from mock API & output to DOM as $scope.lineup
		getLineup()
		.then(
			lineupData => {
				// for (let artist in lineupData) {
				// 	lineupData[artist].addedByUser = false;
				// }
				$scope.lineup = convertObjToArray(lineupData);
			},
			error => console.log(error)
		);

		// when user clicks "add", build out an artist obj to add based on event target ID
		$scope.buildArtistObject = function (event, index) {
			// $scope.lineup[index].addedByUser = true;
			chosenArtist = event.target.id;
			artistToAdd.name = chosenArtist;
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
					() => getList(searchParam),
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
					data => console.log(data),
					error => console.log(error)
				)
			console.log(list);
			}

			// firebase query to access all user's artist selections from database
			// this should probably be a factory so i can use it on lists page
				let ref = new Firebase(`${firebaseURL}lists/${list}`);
				let currentUserArtists = [];
				ref.orderByChild('name').on('child_added', function (snapshot) {
					console.log(snapshot.key() + ' is ' + snapshot.val().name);
					currentUserArtists.push(snapshot.val().name);
				});
			}


		// attaches list ID as property of a user
		let assignListToUser = (listID) => {
			for (let key in currentUserData) {
				let userRef = new Firebase(`${firebaseURL}users/${key}`);
				userRef.update({list: listID});
			}
		}

	}]
);