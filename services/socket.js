const socket = require("socket.io-client");
export default new (class Socket {
	constructor() {
		this.source = "API_Usermanagement";
		// this.url = process.env.CENTRAL_SOCKET_URL;
		this.url = "http://localhost:8000";
	}
	dataProvisioner(channel, action, data) {
		return JSON.stringify({
			source: this.source,
			channel,
			action,
			data
		});
	}
	users(channel, action, data) {
		let client = socket(`${this.url}/users`);
		console.log(`${this.url}/users`);
		console.log(this.dataProvisioner(channel, action, data));
		client.emit(channel, this.dataProvisioner(channel, action, data));
	}
	visitors(channel, action, data) {
		let client = socket(`${this.url}/visitors`);
		client.emit(channel, this.dataProvisioner(channel, action, data));
	}
})();
