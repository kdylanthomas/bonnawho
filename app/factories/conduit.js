'use strict';

app.factory('conduit', function () {

	let searchParams = "";

	let Conduit = {
		getSearchParams: () => searchParams,
		setSearchParams: (value) => searchParams = value
	}

	return Conduit;
});