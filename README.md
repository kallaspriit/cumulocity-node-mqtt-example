# cumulocity-node-mqtt-example
**Minimalistic node.js application performing initial credentials request and periodically reporting measurements.**

## Running
- Run `npm install` to install the dependencies.
- Edit configuration in `index.js` file to point to your Cumulocity tenant.
- Run `npm start` to start the application.
- Use the Cumulocity device management application UI and register device "nodejs" (set in the `index.js` file `config.client` variable).
- The app should now get tenant and credentials from the server and use this to recreate the client connection and start sending measurements.
- See (Cumulocity docs)[https://www.cumulocity.com/guides/mqtt/device-integration/] for details of how this works.
