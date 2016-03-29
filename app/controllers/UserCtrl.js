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
	"$firebaseObject",

	function ($scope, authenticate, getUser, firebaseURL, getArtist, $q, $http, getList, spotify, $firebaseObject) {

		let user = authenticate.getCurrentUser(); // holds firebase authData object
		let list; // holds unique firebase-generated key that corresponds to a user's list

		// ***********************
		// INITIAL POPULATE PAGE
		// ***********************

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
				listData => {
					for (let item in listData) { // artist on user listData
           	listData[item].url = `${firebaseURL}lists/${list}/${item}`; // save firebase ref
						$scope.currentUserArtists.push(listData[item]); // push each item on list to scoped array
					}
				},
				err => console.log(err)
			)
		}

		// ***********************
		// MANAGING VISIBILITY
		// ***********************

		$scope.hideDetail = function () {
			$scope.activeIndex = null;
		}

		$scope.isShowing = function (index) {
			return $scope.activeIndex === index;
		}

		// ***********************
		// BUILD ARTIST DETAIL VIEW
		// ***********************

		// Show or hide list item detail on click
		$scope.showDetail = function (index, artist) {
			$scope.hideDetail(); // closes last card before loading any data for new one
			$scope.data = $firebaseObject(new Firebase(artist.url)); // set $scope.data to firebase obj for currently open artist
			getArtist(artist.artistID) // get everything i want from firebase artist object
			.then(
				artistData => { // if I add images to database, grab them here (all Firebase info should come here)
					$scope.dayPlaying = artistData.day; // adds day artist is playing to page
					$scope.fillStars($scope.data.rating); // hiding this here in lieu of another promise
					if ($scope.data.comments === '') {
						  $scope.editorEnabled = true;
					} else {
						 $scope.editorEnabled = false;
					}
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

		// ***********************
		// DELETING ARTISTS
		// ***********************

		$scope.deleteArtist = function (artist) { // delete
			$http.delete(`${artist.url}.json`)
			.success(
				() => {
					console.log(`you deleted ${artist.artistID}`);
					$scope.populateList(); // repopulate updated list
				},
				error => console.log(error)
			)
		}

		// ***********************
		// UPDATING ARTISTS
		// ***********************

		$scope.changeRating = function (artist, index) {
			let newRating = index + 1;
			let oldRating = $scope.data.rating;

			let listItemRef = new Firebase(artist.url);
			let firebaseObj = $firebaseObject(listItemRef);

			firebaseObj.$bindTo($scope, "data").then(() => {
				console.log($scope.data);
				$scope.data.rating = newRating;
				listItemRef.update({ rating: newRating });
				listItemRef.update({listened: true});
			})

			$scope.fillStars(newRating); // reflect new rating with stars
		}

		$scope.addComment = function (artist, index) {
			let listItemRef = new Firebase(artist.url);
			let firebaseObj = $firebaseObject(listItemRef);

			firebaseObj.$bindTo($scope, "data").then(() => {
				console.log($scope.data);
				$scope.data.comments = $scope.currentUserArtists[index].comments;
				listItemRef.update({comments: $scope.currentUserArtists[index].comments})
			});
		}

	  $scope.enableEditor = function() {
	    $scope.editorEnabled = true;
	  };

	  $scope.disableEditor = function() {
	    $scope.editorEnabled = false;
	  };

		$scope.fillStars = function (rating) {
			console.log('rating', rating);
			$scope.stars = [];
			for (let i = 0; i < 5; i++) {
				var clazz = (parseInt(rating) <= i) ? "star" : "star filled";
				$scope.stars.push({class: clazz});
			}
		}

		// ***********************
		// RETRIEVING SPOTIFY DATA
		// ***********************

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

	}]
)