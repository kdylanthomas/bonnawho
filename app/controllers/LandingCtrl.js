'use strict';

app.controller('LandingCtrl', [
	"$scope",
	"get-lineup",

	function($scope, getLineup) {

		let bonnarooDate = new Date("6/8/2016");
		let today = new Date();
		let timeDiff = Math.abs(today.getTime() - bonnarooDate.getTime());
		$scope.daysUntilBonnaroo = Math.ceil(timeDiff / (1000 * 3600 * 24));

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