import fetch from 'node-fetch';
import axios from 'axios';

import {logger} from './logger.js';
import config from '../config.js';
import {URL} from "url";
const domains = config['com.liferay.lxc.dxp.domains'];

const lxcDXPMainDomain = config['com.liferay.lxc.dxp.mainDomain'];
const lxcDXPServerProtocol = config['com.liferay.lxc.dxp.server.protocol'];


const oauth2JWKSURI = `${lxcDXPServerProtocol}://${lxcDXPMainDomain}`;

const documentByIdEndPoint = 'o/headless-delivery/v1.0/documents';

async function fetchDocument(documentId,req) {
    const apiUrl = new URL(`${oauth2JWKSURI}/${documentByIdEndPoint}/${documentId}`);
    const payload = {
        userId: 'user123', // Example payload data
    };

    const [, bearerToken] = req.headers.authorization.split('Bearer ');
    console.log(bearerToken);
    const headers = {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json', // Adjust content type as per your API requirements
    };

    try {
        const response = await fetch(apiUrl.href, {
            method: 'GET', // Replace with the HTTP method you need (GET, POST, PUT, etc.)
            headers,
        });

        if (!response.ok) {
            throw new Error('Request failed with status: ' + response.status);
        }

        const data = await response.json();
        console.log('Received data:', data.body);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function test(id,req)
{
    let prom = new Promise((resolve, reject)=>{
        const [, bearerToken] = req.headers.authorization.split('Bearer ');
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'http://127.0.0.1:8080/o/headless-delivery/v1.0/documents/'+id,
            headers: {
                'Authorization': 'Bearer '+bearerToken
            }
        };
        let requestObj = axios.request(config)
            .then((response) => {
                console.log('success')
                console.log(JSON.stringify(response.data));
                resolve(response.data);
            })
            .catch((error) => {
                console.log(error.message);
            });

    });
    return prom;
}
export async function getImageById(id, req) {
    let data = await test(id, req);
    //fetchDocument(id,req);

}


