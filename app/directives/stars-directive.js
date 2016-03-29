"use strict";

app.directive("starRating", function() {
  return {
    restrict: "E", // Restrict directive to element
    scope: {
      selectedArtist: "=artist",  // Bind the `song` attribute in the DOM to the selectedSong locally scoped variable
      maxRating: "=" // Bind `max-rating` to maxRating local variable
    },
    templateUrl: "partials/stars.html",
    link: function(scope) {

      /*
        Create a new key on the song called `stars`. It's
        an array of objects. Each object contains which
        class to use on each of the stars.
       */
      function setStars() {
        scope.stars = [];

        if ( scope.selectedArtist.hasOwnProperty("rating") ) {
          for (var i = 0; i < scope.maxRating; i++) {
            var clazz = (parseInt(scope.selectedArtist.rating) <= i) ? "star" : "star filled";
            scope.stars.push({class: clazz});
          }
        }
      }

      /*
        Since the selectedSong in the `song-view` template
        is bound directly to an object in the controller
        that gets updated after an XHR, I have to watch that
        variable for changes and then run the logic again
        once it gets updated values.
       */
      scope.$watch('selectedArtist', function(value){
        console.log("value changed");
        scope.selectedArtist = value;
        setStars();
      });

      setStars();

    }
  };
});

