/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

import express from 'express';

import config from './util/configTreePath.js';
import {corsWithReady, liferayJWT} from './util/liferay-oauth2-resource-server.js';
import {logger} from './util/logger.js';
import facebook  from './externalObjects/facebook.js';
const serverPort = config['server.port'];
const app = express();

logger.log(`config: ${JSON.stringify(config, null, '\t')}`);

app.use(express.json());
app.use(corsWithReady);
app.use(liferayJWT);
app.get(config.readyPath, (req, res) => {
	res.send('READY');
});
app.use('/dynamic/facebook', facebook);
app.listen(serverPort, () => {
	logger.log(`App listening on ${serverPort}`);
});

export default app;
