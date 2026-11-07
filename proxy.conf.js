const target = process.env.PROXY_TARGET || "http://localhost:8484";

module.exports = {
	"/api": {
		"target": target,
		"secure": false,
		"changeOrigin": true,
		"ws": true
	},
    "/oauth": {
		"target": target,
		"secure": false,
		"changeOrigin": true,
		"ws": true
	}
};
