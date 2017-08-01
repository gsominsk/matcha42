class Ajax {
	constructor () {

	}

	sendRequest (url, req, callback) {
		var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
		var xhr = new XHR();
		xhr.open((req.type == 'POST' ? 'POST' : 'GET'), url);
		// xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function (e) {
			if (xhr.status != 200) {
				console.log(xhr.status + ': ' + xhr.statusText);
				return (NULL);
			} else {
				let str = JSON.parse(xhr.responseText);
				callback(str);
			}
		};
		xhr.send((req.body ? JSON.stringify(req.body) : 0));
	}
}
