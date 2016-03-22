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

		// Convert data to array and return array--will define $scope.lineup && $scope.users
		let convertObjToArray = (obj) => {
			let arr = [];
			for (let key in obj) {
				// store key as a property of obj for reference on page
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
			let artist = event.target.id;

			let artistToAdd = {
				name: artist,
				listened: false,
				rating: 0
			};

			// next, see if there is a list to add this artist to
			// ?? is it ideal to keep passing this artistToAdd obj down several functions?
			$scope.findUserList(artistToAdd);
		}

		$scope.findUserList = function (artistToAdd) {
			let user = authenticate.getUser();
			let list;

			// search for current user's data object with orderBy/equalTo queries
			getUser(user.uid)
			.then(
				currentUser => {
					console.log('current user after promise', currentUser);
					// does user have a list?
					for (let key in currentUser) {
						// if so, assign their list ID to the list variable; if not, let list = null
						if (currentUser[key].list) {
							list = currentUser[key].list;
						} else {
							console.log('no list exists for ' + currentUser[key].uid);
							list = null;
						}
						$scope.addArtistToList(artistToAdd, list);
					}
				},
				error => console.log(error)
			)
		}

		$scope.addArtistToList = function (artistToAdd, list) {
			// store search param to indirectly access a user's new list after it has been created
			let searchParam = artistToAdd.name;
			// *** IF USER DOES NOT YET HAVE A LIST:
			if (!list) {
				console.log(list);
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
						console.log('listData', listData);
						for (let key in listData) {
							console.log('list key', key);
							list = key;
							console.log(list);
							assignListToUser(list);
						}
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
			// grab userData again so you can update user object with their unique list key
			let user = authenticate.getUser();
			getUser(user.uid)
			.then(
				userData => {
					// why does this log so many times?
					console.log('user data', userData);
					for (let key in userData) {
						console.log('key', key);
						let userRef = new Firebase(`${firebaseURL}users/${key}`);
						userRef.update({list: listID})
					}
				},
				error => console.log(error)
			)
		}

		// // TODO: if artist was added to list, add button should be disabled;
		// // if user deletes artist from their list, button should be enabled again

	}]
);