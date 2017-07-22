class Ajax {
	constructor () {

	}

	sendRequest (url, body, callback) {
		var XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
		var xhr = new XHR();
		xhr.open('POST', url);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.body
		xhr.onload = function (e) {
			if (xhr.status != 200) {
				console.log(xhr.status + ': ' + xhr.statusText);
				return (NULL);
			} else {
				let str = JSON.parse(xhr.responseText);
				callback(str);
			}
		};
		xhr.send((body ? body : 0));
	}
}
