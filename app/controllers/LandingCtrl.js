'use strict';

app.controller('LandingCtrl', [
	"$scope",
	"get-lineup",

	function($scope, getLineup) {
		$scope.lineup = [];
		$scope.randomArtists = [];
		// function that randomly gets ~3-4 artists from lineup and pushes to $scope.randomArtists
		getLineup()
		.then(
			lineup => {
				let arr = [];
				for (let key in lineup) {
					lineup[key].key = key;
					arr.push(lineup[key]);
				}
				$scope.lineup = arr;
				$scope.getRandomArtists(arr);
			},
			err => console.log(err)
		)

		$scope.getRandomArtists = function (arr) {
			let max = arr.length;
			let min = 0;
			while ($scope.randomArtists.length < 4) {
				let randomIndex = Math.floor(Math.random() * (max - min + 1)) + min;
				console.log($scope.lineup[randomIndex]);
				$scope.randomArtists.push($scope.lineup[randomIndex]);
				console.log(randomIndex);
			}
		}
	}
])