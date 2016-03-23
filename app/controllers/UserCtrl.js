"use strict";

app.controller("UserCtrl", [
	"$scope",
	"authenticate",
	"get-user",
	"firebaseURL",
	"get-artist",
	"$http",

	function ($scope, authenticate, getUser, firebaseURL, getArtist, $http) {

		let user = authenticate.getCurrentUser();
		let list;

		$scope.populateList = () => {
			$scope.currentUserArtists = [];
			getUser(user.uid)
			.then(
				userData => {
					for (let user in userData) {
						list = userData[user].list;
						console.log(list);
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

		$scope.updateUserList = function (event, action) {
			let artistToUpdate = event.target.className;
			let keyToSearch;
			let listItemURL;

			console.log(artistToUpdate);
			// gets the user's list
			$http.get(`${firebaseURL}lists/${list}/.json`)
			.success(
				data => {
					// find the object in the list that contains the artist the user clicked
					for (let key in data) {
						if (data[key].name === artistToUpdate) {
							keyToSearch = key;
						}
						// build URL for artist object inside a user's list
						listItemURL = `${firebaseURL}lists/${list}/${keyToSearch}/`;
					};
					if (action === 'delete') {
						$http.delete(`${listItemURL}.json`)
						.success(
							() => {
								console.log(`you deleted ${artistToUpdate}`);
								$scope.populateList();
							},
							error => console.log(error)
							)
					} else if (action === 'update') {
						let listItemRef = new Firebase(listItemURL);
						listItemRef.update({listened: true});
					}
				},
				error => console.log(error)
			)
		}


	}]
)
