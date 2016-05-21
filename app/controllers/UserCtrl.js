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

		// takes hh:mm:ss time format from firebase, converts military hours, and returns h:mm
		let createCommonTimeString = (date) => {
			var parsedDate = date.split(":");
			if (parsedDate[0] > 12) parsedDate[0] -= 12;
			else if (parsedDate[0] === "00") parsedDate[0] = 12;
			else if (parsedDate[0] < 10) parsedDate[0] = parsedDate[0].slice(1,2);
			return parsedDate[0] + ":" + parsedDate[1];
		}

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
							if (!userData[user].list) {
								return; // only continue if user has a list
							} else {
								list = userData[user].list; // get user's list key for getList request
							}
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

		$scope.showSchedule = false;

		// ***********************
		// MANAGING VISIBILITY
		// ***********************

		$scope.hideDetail = function () {
			$scope.activeIndex = null;
		}

		$scope.isShowing = function (index) {
			return $scope.activeIndex === index;
		}

		$scope.listFilter = '';

		$scope.switchView = function (filter) {
			$scope.hideDetail();
			$scope.populateList();
			$scope.showSchedule = false;
			// // show "bummer!" message if no artists fit filter

			// define filter
			if (!filter) {
				$scope.listFilter = '';
			} else {
				return $scope.listFilter = filter;
			}
		}

		// loads schedule view with artists a user has rated 3+ stars
		$scope.populateFavorites = function (arr) {
			$scope.favoriteArtists = [];
			arr.forEach((el, i) => {
				if (el.listened === true && el.rating >= 3) {
					var favoriteArtist = el;
					favoriteArtist.start = createCommonTimeString(el.start);
					favoriteArtist.end = createCommonTimeString(el.end);
					$scope.favoriteArtists.push(favoriteArtist);
				}
			})
			$scope.showSchedule = true;
		}


		// ***********************
		// BUILD ARTIST DETAIL VIEW
		// ***********************

		// Show or hide list item detail on click
		$scope.showDetail = function (index, artist) {
			$scope.data = null;
			$scope.data = $firebaseObject(new Firebase(artist.url)); // set $scope.data to firebase obj for currently open artist
			$scope.hideDetail(); // closes last card before loading any data for new one
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
					if (artistData.searchTerm) {
						return spotify.searchArtist(artistData.searchTerm); // quick fix for dead & co
					} else {
						return spotify.searchArtist(artistData.artist); // retrieves Spotify artist ID for future requests
					}
				},
				err => console.log(err)
			).then(
				spotifyData => { // used to retrieve artist's ID for subsequent spotify requests
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
			console.log('artist', artist);
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
			console.log(artist);
			let newRating = index + 1;
			artist.rating = newRating;
			let listItemRef = new Firebase(artist.url);
			listItemRef.update({ rating: newRating });
			listItemRef.update({ listened: true });
			$scope.fillStars(newRating); // reflect new rating with stars
		}

		$scope.addComment = function (artist) {
			let listItemRef = new Firebase(artist.url);
			listItemRef.update({comments: artist.comments});
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
		// DISPLAYING SPOTIFY DATA
		// ***********************

		let showRelatedArtists = (id) => {
			$scope.relatedArtists = []; // initialize as empty each time a request is made
			spotify.getRelatedArtists(id)
			.then(
				relatedArtists => {
					for (let i = 0; i < 4; i++) { // get four related artists
						$scope.relatedArtists.push(relatedArtists.artists[i].name);
					}
					$scope.relatedArtists = $scope.relatedArtists.join(', ');
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
					for (let i = 0; i < 3; i++) { // show top three tracks
						let topTrack = {
							name: "",
							uri: "",
							id: ""
						}
						topTrack.name = tracks.tracks[i].name;
						topTrack.uri = tracks.tracks[i].uri;
						topTrack.id = tracks.tracks[i].id;
						$scope.topTracks.push(topTrack);
					}
				},
				err => console.log(err)
			)
		}

	}]
)