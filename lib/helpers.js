/*
	Helpers for various tasks
*/


// Dependencies
const crypto	= require( 'crypto' );
const config	= require( '../config/config' );
const isEmail   = require( 'isemail' );
const { statSync } = require( 'fs' );


// Create a SHA256 hash
const createHash	= str => {
	if ( validateString( str ) ) {
		return crypto.createHmac( 'sha256', config.hashSecret ).update( str ).digest( 'hex' );
	} else {
		return false;
	}
};

// Create web message - HTML
const createHTMLMessage = orderObj => {
	console.log( '[ helpers ] - orderObj: ', orderObj );
	let htmlMessage   = `<html>`;
	htmlMessage += `<body style="background-color: #f6f6f6;"> `;
	htmlMessage += `<main style="margin-top: 35px;"> `;
	htmlMessage += `</br></br></br> `;
	htmlMessage += `<div style="text-align: center;"> `;
	htmlMessage += `<h1>Total: $ ${ orderObj.total } Paid</h1> `;
	htmlMessage += `<h2>Thanks for using or73 Inc.</h2> `;
	htmlMessage += `</div> `;
	htmlMessage += `</br></br></br>`;
	htmlMessage += `<div align="center"> `;
	htmlMessage += `<table style="max-width: 100%"> `;
	htmlMessage += `<tbody> `;
	htmlMessage += `<tr><td><strong>Order Id</strong>:</td><td></td><td>${ orderObj.shoppingCartId}</td></tr> `;
	htmlMessage += `<tr><td><strong>Invoice</strong>:</td><td></td><td>${ orderObj.id }</td> </tr> `;
	htmlMessage += `<tr><td><strong>Authorization Date</strong>:<td></td></td><td>${ orderObj.authorizationDate}</td></tr> `;
	htmlMessage += `<tr><td><strong>currency</strong>:</td><td>${ orderObj.currency }</td></tr>`;
	htmlMessage += `<tr><td><strong>Payment Method</strong>:</td><td>${ orderObj.paymentMethod } - ${ orderObj.object }</td></tr>`;
	htmlMessage += `<tr><td><strong>Last 4 Digits</strong>:</td><td>${ orderObj.last4 }</td></tr>`;
	htmlMessage += `</tbody> `;
	htmlMessage += `</table> `;
	htmlMessage += `</div> `;
	htmlMessage += `</br></br></br> `;
	htmlMessage += `<div align="center"> `;
	htmlMessage += `<table style="white-space: nowrap; max-width: 90%"> `;
	htmlMessage += `<thead style="text-align: center"> `;
	htmlMessage += `<tr><th>Product</th><th>Price</th><th>Qtty</th><th>Total</th></tr> `;
	htmlMessage += `</thead> `;
	htmlMessage += `<tbody style="text-align: left"> `;
	
	const items = orderObj.items;
	items.forEach( item => {
		htmlMessage   += `<tr> `;
		htmlMessage   += `<td style="padding: 0 .5em;">${ item.name }</td> `;
		htmlMessage   += `<td style="text-align: right; padding: 0 1em;">$ ${ item.price }</td> `;
		htmlMessage   += `<td style="text-align: center; padding: 0 1em;">${ item.qtty }</td> `;
		htmlMessage   += `<td style="padding: 0 1em; text-align: right;">$ ${ item.total }</td> `;
		htmlMessage   += `</tr> `;
	} );
	
	htmlMessage += `</tbody> `;
	htmlMessage += `<tfoot style="text-align: right"> `;
	htmlMessage += `<tr style="height: 3px;"></tr> `;
	htmlMessage += `<tr><td colspan="3"></td><td style="border-top: 3px double black"></td></tr> `;
	htmlMessage += `<tr style="height: 3px"></tr>`;
	htmlMessage += `<tr style="border-top: 2px solid #333;"> `;
	htmlMessage += `<td style="text-align: right;" colspan="3"><strong>Total</strong></td> `;
	htmlMessage += `<td style="text-align: right; padding: 0 1em;"><strong>$ ${ orderObj.total }</strong></td> `;
	htmlMessage += `</tr> `;
	htmlMessage += `</tfoot> `;
	htmlMessage += `</table> `;
	htmlMessage += `</div> `;
	htmlMessage += `</br></br> `;
	htmlMessage += `<div style="text-align: center"> `;
	htmlMessage += `<h4>or73 Inc. 123 Some Place, The World 123456</h4> `;
	htmlMessage += `<footer> `;
	htmlMessage += `Questions? Email <a href="mailto:">support@or73.inc</a> `;
	htmlMessage += `</footer> `;
	htmlMessage += `</div> `;
	htmlMessage += `</br></br> `;
	htmlMessage += `</main> `;
	htmlMessage += `</body> `;
	htmlMessage += `</html> `;
	return htmlMessage;
};

// Create a new time format
const createDateFormat  = dateTime => {
	const tokenDataDate  = new Date( dateTime );
	const tokenDataExp  = `${ tokenDataDate.getFullYear() }/${ tokenDataDate.getMonth() + 1 }/${ tokenDataDate.getDate() }  ${ tokenDataDate.getHours() }:${ tokenDataDate.getMinutes() }:${ tokenDataDate.getSeconds()}`;
	return tokenDataExp;
};

// Create a string of random alphanumeric characters of a given length
const createRandomString  = strLength => {
	strLength   = typeof ( strLength ) === 'number' && strLength > 0 ? strLength : false;
	
	if ( strLength ) {
		// Define all the possible characters that could go into a string
		let possibleCharacters  = 'abcdefghijklmnopqrstuvwxyz0123456789';
		
		// start the final string
		let str = '';
		for ( let i = 1; i <= strLength; i++ ) {
			// Get a random character from the possibleCharacters string
			str += possibleCharacters.charAt( Math.floor( Math.random() * possibleCharacters.length ) );
		}
		return str;
	} else {
		return false;
	}
};

// Extracts entity name from folder name
const entityName    = dirName => {
	return dirName.slice( 0, -1 );
};

const errorTemplate   = ( code='Bad Request', message = '', statusCode = 400 ) => {
	let error = { id: 'error', code, message, statusCode, };
	if ( validateString( code ) ) {
		const eCode = code.toUpperCase();
		error.code      = code;
		switch (eCode) {
			case 'EACCESS':
				error.statusCode     = 403;
				error.message   = `Permission denied... Insufficient permissions.   ${ message }`;
				break;
			case 'EEXIST':
				error.statusCode     = 451;
				error.message   = `File or directory already exists.   ${ message }`;
				break;
			case 'EINVAL':
				error.statusCode     = 412;
				error.message   = `Invalid argument. ${ message }`;
				break;
			case 'ENODATA':
				error.statusCode     = 404;
				error.message   = `No data available. ${ message }`;
				break;
			case 'ENOENT':
				error.statusCode     = 404;
				error.message   = `No such file or directory. ${ message }`;
				break;
			case 'EPERM':
				error.statusCode     = 405;
				error.message   = `Operation not permitted. ${ message }`;
				break;
			case 'ETIME':
				error.statusCode     = 428;
				error.message   = `Timer expired. ${ message }`;
				break;
			default:
				error.statusCode     = statusCode;
				error.message   = message;
				break;
		}
		return error;
	} else {
		console.log( '[ helpers.errorTemplate ] - code: ', code );
		error.message += 'An unknown error was send';
		return error;
	}
};

// Parse a JSON string to an object in all cases, without throwing
const parseJsonToObject	= str => {
	try {
		return JSON.parse( str );
	} catch ( e ) {
		return false;
	}
	//return JSON.parse( str );
};

// Parse an object to s JSON string in all cases, without throwing
const parseObjectToJson = obj => {
	try {
		JSON.stringify( obj );
	} catch ( e ) {
		return false;
	}
	return JSON.stringify( obj );
};

const responseTemplate  = ( statusCode, message, data ) => {
	return { id: 'answer', statusCode, message, data };
};

const validateArray = arr => {
	return ( typeof arr instanceof Array && arr.length > 0 );
};

const validateEmail = ( email ) => {
	// const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	//
	// return re.test( email );
	return isEmail.validate( email );
};

const validateFileExist = ( filePath ) => {
	try {
		statSync( filePath );
		return true;
	} catch (e) {
		return false;
	}
	
};

const validateString = ( stringToValidate ) => {
	return typeof stringToValidate === 'string' && stringToValidate.length > 0;
};

const validateStatusCodeOk  = data => {
	return ( data.statusCode === 200 || data.statusCode === 201 );
};

const validateValueInArray  = ( value, dataArray ) => {
	return dataArray.includes(value);
};


module.exports  = {
	createDateFormat,
	createHash,
	createHTMLMessage,
	createRandomString,
	errorTemplate,
	parseJsonToObject,
	parseObjectToJson,
	responseTemplate,
	validateEmail,
	validateFileExist,
	validateStatusCodeOk,
	validateString,
	validateValueInArray,
};
