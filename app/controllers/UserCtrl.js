"use strict";

app.controller("UserCtrl", [
	"$scope",
	"authenticate",
	"get-user",
	"firebaseURL",
	"get-artist",
	"$q",
	"$http",

	function ($scope, authenticate, getUser, firebaseURL, getArtist, $q, $http) {

		let user = authenticate.getCurrentUser(); // holds firebase authData object
		let artistToUpdate; // holds unique firebase-generated key for an artist object inside a user's list object
		let list; // holds unique firebase-generated key that corresponds to a user's list

		$scope.populateList = () => {
			$scope.currentUserArtists = [];
			getUser(user.uid)
			.then(
				userData => {
					for (let user in userData) {
						list = userData[user].list;
					}
					let ref = new Firebase(`${firebaseURL}lists/${list}`);
					// this returns each artist key that has been added to a user's list
					ref.orderByChild('name').on('child_added', function (snapshot) {
						let currentArtist = snapshot.val().name;
						// make a GET request to /artists for each artist on a user's list
						getArtist(currentArtist)
						.then(
							data => {
								data.key = currentArtist;
								// store each artist in currentUserArtists arr and output to DOM
								$scope.currentUserArtists.push(data);
							},
							error => console.log(error)
							)
					});
				},
				error => console.log(error)
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
							if (data[key].name === artistToUpdate) {
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
					let listItemRef = new Firebase(url);
					listItemRef.update({listened: true});
				},
				error => console.log(error)
			)
		}

		$scope.deleteArtist = function (event) {
			artistToUpdate = event.target.className;
			$scope.buildListURL(artistToUpdate)
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

	}]
)