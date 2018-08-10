/*
* Tokens controller
* */

// Dependencies
const {
	createDateFormat,
	createRandomString,
	errorTemplate,
	createHash,
	parseJsonToObject,
	parseObjectToJson,
	responseTemplate,
	validateString,
	validateStatusCodeOk }  = require( '../lib/helpers' );
const dataService           = require( '../services/data' );
const { validateEmail }     = require( '../lib/helpers' );

// Instantiating services
const tokenService  = dataService( 'tokens' );
const userService   = dataService( 'users' );

/*
* Token - POST
* Required data: payload → email, password
* Optional data: None
* Procedure description:  1. Validate user exists
*                         2. Create token object
*                         3. Stores token object
* */
const tokenPost =  async data => {
	console.log( ' Tokens '.bgGreen.black.bold, ' POST '.bgCyan.grey.bold );
	const payload       = data.payload;
	const emailReq      = ( validateString( payload.email ) && validateEmail( payload.email ) ) ? payload.email : false;
	const passwordReq   = validateString( payload.password) ? createHash( payload.password ) : false;
	
	// Validate if required data was provided
	if ( emailReq && passwordReq ) {
		console.log( `[ tokens.tokenPost ] - email and password have been provided` );
		// Validate if user exists
		const userServRead  = await userService._read( emailReq );
		if ( validateStatusCodeOk( userServRead ) ) {
			const userData  = parseJsonToObject( userServRead.data);
			const email     = userData.email;
			const password  = userData.password;
			if ( email === emailReq && password === passwordReq ) {
				// If valid, create a new token with a random name.  Set expiration date 1 hour in the future
				const tokenId = createRandomString(20);
				if ( tokenId ) {
					const expires = Date.now() + 1000 * 60 * 60 * 24;    // 1000 * 60 = 1 sec   (1000 * 60) * 60 1 hour   (1000 * 60) * 60 * 24 = 1 day
					const tokenObj = {
						tokenId,
						email,
						expires,
					};
					const tokenServCreateMsg = await tokenService._create( tokenId, tokenObj );
					if (validateStatusCodeOk(tokenServCreateMsg)) {
						return responseTemplate(200, 'User logged in', tokenObj);
					} else {
						return errorTemplate('ENODATA', 'Token was not created [ token.tokenPost]');
					}
				} else {
					tokenId.message += ' [ tokens.tokenPost ]';
					return tokenId;  //errorTemplate('ENODATA', 'Token was not created');
				}
			} else {
				return errorTemplate('EINVAL', 'Email or password is wrong [ token.tokenPost ]');
			}
		} else {
			userServRead.message += '[ token.tokenPost ]';
			return userServRead; //errorTemplate( 'ENOENT' );
		}
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields [ token.tokenPost ]' );
	}
};


/*
* Token - GET
* Required data: queryStringObject → token
* Optional data: None
* Procedure description:  1. Validate token exists
*                         2. Retrieves token information or tokens list
* Two operations are available:
*     1. Get information of one token
*     2. Get a list of existing tokens
*
*      Description                    Path
* Get information of one token    http://localhost:3000/tokens?id=<validTokenId>
* Get a list of existing tokens   http://localhost:3000/tokens?all
* */
const tokenGet  = async data => {
	console.log( ' Tokens '.bgGreen.black.bold, ' GET '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	const token = ( validateString( queryStringObject.id ) && queryStringObject.id.length === 20 ) ? queryStringObject.id : false;
	const all   =  ( typeof queryStringObject.all === 'string' && queryStringObject.all.length === 0 );
	
	// Validate if token value was provided
	if ( token ) {
		// Validate if token file exists
		const tokenServReadMsg  = await tokenService._read( token );
		if ( validateStatusCodeOk( tokenServReadMsg ) ) {
			const tokenData     = parseJsonToObject(tokenServReadMsg.data);
			const tokenDataExp  = createDateFormat( tokenData.expires);
			tokenData.expires   = tokenDataExp;
			return responseTemplate(200, 'Token fetched successfully', tokenData);
		} else {
			tokenServReadMsg.message += ' [ tokens.tokenGet ]';
			return tokenServReadMsg;
		}
	} else if ( all ) {    // List all tokens, if a token is not provided
		const tokensListDetails = await tokenService._contentOfAllFiles( );
		console.log( `[ tokens.tokenGetAll ] - tokensListDetails: `, tokensListDetails );
		if ( validateStatusCodeOk( tokensListDetails ) ) {
			console.log( `[ tokens.tokenGetAll ] - tokensListDetails validated ` );
			const listDetailsData   = tokensListDetails.data;
			console.log( `[ tokens.tokenGetAll ] - listDetailsData: `, listDetailsData );
			let tokensList = [];
			listDetailsData.forEach( tokenObject => {
				const infoObj = parseJsonToObject( tokenObject );
				console.log( `[ tokens.tokenGetAll ] - infoObj `, infoObj );
				const infoObjNewDate = new Date( infoObj.expires );
				const newTokenObj = {
					//tokenId: infoObj.tokenId,
					email: infoObj.email,
					expires: `${ infoObjNewDate.getFullYear() }/${ infoObjNewDate.getMonth() + 1 }/${ infoObjNewDate.getDate() }  ${ infoObjNewDate.getHours() }:${ infoObjNewDate.getMinutes() }:${ infoObjNewDate.getSeconds()}`,
				};
				tokensList.push(newTokenObj);
			});
			return responseTemplate( 200, 'Token list fetched successfully [ tokens.tokenGet ]', tokensList );
		} else {
			tokensListDetails.message   += ' [ tokens.tokenGet ]';
			return tokensListDetails; // errorTemplate( 'ENODATA', 'Token list was not fetched, maybe do not exist tokens' );
		}
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields [ tokens.tokenGet ]' );
	}
};


/*
* Token - UPDATE
* Required data: queryStringObject → token
* Optional data: None
* Procedure description:   1. Validate if token exists
*                          2. Reset token timer
*                          3. Update token data
* */
const tokenPut  = async data => {
	console.log( ' Tokens '.bgGreen.black.bold, ' PUT '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	const token     = ( validateString( queryStringObject.id ) && queryStringObject.id.length === 20 ) ? queryStringObject.id : false;
	
	// Validate token data
	if ( token ) {
		const tokenDataMsg   = await tokenService._read( token );
		if ( validateStatusCodeOk( tokenDataMsg ) ) {
			const tokenData   = parseJsonToObject(tokenDataMsg.data);
			const tokenDataObj = {
				tokenId: tokenData.tokenId,
				email: tokenData.email,
				expires: Date.now() + 1000 * 60 * 60 * 24,
			};
			const tokenServUp   = await tokenService._update( token, parseObjectToJson( tokenDataObj ) );
			const tokenDataExp  = createDateFormat( tokenDataObj.expires);
			tokenDataObj.expires= tokenDataExp;
			if (validateStatusCodeOk( tokenServUp ) ) {
				return responseTemplate( 200, 'Token time has been reset successfully', tokenDataObj );
			} else {
				tokenServUp.message += ' Token could not be updated, its time was not reset [ tokens.tokenPut ]';
				return tokenServUp;  //errorTemplate( 'EACCESS', 'Token time was not reset' );
			}
		} else {
			tokenDataMsg.message += 'Token data was not fetched [ tokens.tokenPut ]';
			return tokenDataMsg; // errorTemplate( 'EACCES' );
		}
	}  else {
		return errorTemplate( 'EACCES', ' Token invalid was provided, it is not a string value [ tokens.tokenPut ]' );
	}
};


/*
* Token - DELETE
* Required data: queryStringObject → token
* Optional data: None
* Procedure description:   1. Validate if token exist
*                          2. Delete token
* */
const tokenDelete   = async data => {
	console.log( ' Tokens '.bgGreen.black.bold, ' DELETE '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	
	const token     = ( validateString( queryStringObject.id ) && queryStringObject.id.length === 20 ) ? queryStringObject.id : false;
	
	if ( token ) {
		// Validate if token file exist
		const tokenServReadMsg  = await tokenService._read( token );
		if ( validateStatusCodeOk( tokenServReadMsg ) ) {
			const deleteTokenMsg = await tokenService._delete( token );
			if ( validateStatusCodeOk( deleteTokenMsg ) ) {
				return responseTemplate( 200, `Token deleted successfully`, {} );
			} else {
				deleteTokenMsg.message  += ' Token invalid [ tokens.tokenDelete ]';
				return deleteTokenMsg; //errorTemplate( 'EPERM', `Token has not be deleted` );
			}
		} else {
			tokenServReadMsg.message    += ' Token could not be fetched [ tokens.tokenDelete ]';
			return tokenServReadMsg;
		}
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields [ tokens.tokenDelete ]' );
	}
};


module.exports  = {
	post    : tokenPost,
	get     : tokenGet,
	put     : tokenPut,
	delete  : tokenDelete,
};
