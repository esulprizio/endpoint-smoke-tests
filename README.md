## Smoke Test

Quick and dirty scripts to smoke test 6RS endpoints. Contains one script currently `SouthboundEndpointSmokeTest` which will try to verify that all Southbound endpoints defined in the Standard API are reachable through an authenticated HTTP request by checking status codes for unexpected values.

### Installation

Run `npm i` to install dependencies.

### Running it

Run `node SouthboundEndpointSmokeTest.js` to read usage documentation.