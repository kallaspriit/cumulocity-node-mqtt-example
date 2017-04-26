import mqtt from 'mqtt';

// cumulocity MQTT configuration
const config = {
	protocol: 'tcp',
	host: 'example.cumulocity.com', // change me!
	port: 1883,
	clientId: 'nodejs',

	bootstrap: {
		username: 'management/devicebootstrap',
		password: 'Fhdt1bb1f',
		subscribeChannel: 's/dcr',
		publishTopic: 's/ucr',
	},
};

// build configuration url
config.url = `${config.protocol}://${config.host}:${config.port}`;

// performs the initial credentials bootstrapping
function bootstrap(mqttUrl, mqttConfig, doneCallback) {
	console.log(`bootstrapping, register device "${config.clientId}"`, mqttUrl, mqttConfig);

	// connect as bootstrap client
	const client = mqtt.connect(mqttUrl, mqttConfig);
	let bootstrapInterval = null;

	client.on('connect', () => {
		console.log('connected without credentials, bootstrapping');

		// subscrive to channel that provides credentials once accepted
		client.subscribe(config.bootstrap.subscribeChannel);

		// check for acceptance periodically
		bootstrapInterval = setInterval(() => {
			console.log('checking for access', config.bootstrap.publishTopic);

			client.publish(config.bootstrap.publishTopic, '');
		}, 1000);
	});

	// listen for messages
	client.on('message', (topic, messageBuffer) => {
		const message = messageBuffer.toString('utf8');

		switch (topic) {
			// we got the credentials
			case config.bootstrap.subscribeChannel: {
				const tokens = message.split(',');
				const tenant = tokens[1];
				const username = tokens[2];
				const password = tokens[3];

				console.log('got credentials', tenant, username, password);

				clearInterval(bootstrapInterval);

				client.end(true, () => {
					console.log('closed bootstrap client');

					doneCallback({
						tenant,
						username,
						password,
					});
				});

				break;
			}

			// got something else, should not get here
			default:
				console.log('got message', topic, message.toString());
				break;
		}
	});
}

// starts the actual client`reporting data
function startClient(mqttUrl, mqttConfig) {
	console.log('starting client', mqttUrl, mqttConfig);

	const client = mqtt.connect(mqttUrl, mqttConfig);

	client.on('connect', () => {
		console.log('mqtt connected with credentials');

		// create device
		client.publish('100,Node MQTT Thermometer,Thermometer');

		setInterval(() => {
			const temperature = Math.round(Math.random() * 100) / 10.0;

			console.log('reporting temperature', temperature);

			// report measurement
			client.publish('s/us', `200,c8y_Temperature,T,${temperature}`);
		}, 1000);
	});

	client.on('error', e => console.error('got error', e));
	client.on('close', () => console.error('closed'));
}

// bootstrap and start client
bootstrap(config.url, {
	clientId: config.clientId,
	username: config.bootstrap.username,
	password: config.bootstrap.password,
}, (credentials) => {
	startClient(config.url, {
		clientId: config.clientId,
		username: `${credentials.tenant}/${credentials.username}`,
		password: credentials.password,
	});
});
