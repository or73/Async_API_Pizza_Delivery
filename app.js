/*
* Server-related tasks
* */

// Dependencies
const fs        = require( 'fs' );
const http      = require( 'http' );
const https     = require( 'https' );
const path      = require( 'path' );
const stringDecoder = require( 'string_decoder' ).StringDecoder;
const url       = require( 'url' );
const util      = require( 'util' );

const debug     = util.debuglog( 'server' );
const config    = require( './config/config' );
const { parseJsonToObject }   = require( './lib/helpers' );
const router    = require( './lib/router' );

const decoder   = new stringDecoder( 'utf-8' );
const HttpPort  = config.httpPort;
const HttpsPort = config.httpsPort;
const MODE      = config.mode;

const server    = {};

/*
* Start HTTP Server
* */
server.httpServer    = http.createServer( ( req, res) => {
	server.unifiedServer( req, res );
} );

/*
* Instantiate HTTPS Server
* */
server.httpsServerOptions   = {
	'key'   : fs.readFileSync( path.join( __dirname, './lib/https/key.pem' ) ),
	'cert'  : fs.readFileSync( path.join( __dirname, './lib/https/cert.pem') )
};

/*
* Start HTTPS Server
* */
server.httpsServer  = https.createServer( server.httpsServerOptions, ( req, res ) => {
	server.unifiedServer( req, res );
} );

/*
 * UnifiedServer
 * All the server logic for both the HTTP and HTTPS servers
 */
server.unifiedServer    = ( req, res ) => {
	// Get parsedUrl from request URL, get path and query string as an object
	const { pathname, query: queryStringObject }    = url.parse( req.url, true );
	const trimmedPath      = pathname.replace( /^\/+|\/+$/g, '' );
	// Get HTTP method
	const method    = req.method.toLowerCase();
	// Get headers as an object
	const headers   = req.headers;
	
	let buffer    = '';
	
	req.on( 'data', data => {
		buffer += decoder.write( data );
	} );
	
	req.on( 'end', async () => {
		buffer += decoder.end();
		
		const isValidRequest    = router.isValidRequest( trimmedPath, method );
		const controller        = isValidRequest ? router[ trimmedPath ] : false;
		const data              = {
			headers,
			method,
			queryStringObject,
			payload: buffer ? parseJsonToObject( buffer ) : {}
		};
		
		const response = controller ? await controller[method](data) : {
			statusCode: router.isValidPath(trimmedPath) ? 405 : 400,
			message: router.isValidPath(trimmedPath) ? 'Method not allowed' : 'Invalid Path',
		};
		res.setHeader( 'Content-Type', 'application/json' );
		res.writeHead( response.statusCode );
		
		const payloadString     = JSON.stringify( response );
		res.end( payloadString );
		
		// If the response is 200 or 201, print green, otherwise print red
		if ( response.statusCode === 200 || response.statusCode === 201 ) {
			//debug( `Returning this response: \n\t statusCode: ${ statusCode } \n\t Payload: ${ payloadString }` );
			debug( '\x1b[32m%s]\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + response.statusCode );
		} else {
			debug( '\x1b[31m%s]\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + response.statusCode );
		}
	} );
};

/*
* HTTP Server
* */
server.httpServer.listen(config.httpPort, () => {
	
	// console.log(`Server is up and listening on port ${ config.httpPort } in ${ config.mode } mode`);
});

/*
* HTTPS Server
* */
server.httpsServer.listen(config.httpsPort, () => {
	console.log( '\x1b[35m%s\x1b[0m', `The server is UP on <'https port'>: ${ HttpsPort } in -> ${ MODE.toUpperCase() } <- mode` );
	// console.log(`Server is up and listening on port ${ config.httpPort } in ${ config.mode } mode`);
});

