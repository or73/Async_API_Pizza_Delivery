/*
* Library for user tokens validation
* */

// Dependencies
const { errorTemplate,
	parseJsonToObject,
	responseTemplate,
	validateEmail,
	validateFileExist,
	validateString }    = require( '../lib/helpers' );
const dataService       = require( '../services/data' );
const path              = require( 'path' );

// Instantiating services
const tokenService  = dataService( 'tokens' );
const _baseDir      = path.join( __dirname, '../.data' );

/*
* validateToken
* Validates if a token and an email are correlated
* */
const validateToken = async ( tokenId, userEmail ) => {
	const token  = ( validateString( tokenId ) && tokenId.length === 20 ) ? tokenId : false;
	const email  = ( validateString( userEmail ) && validateEmail( userEmail ) ) ? userEmail : false;
	
	// if ( token  && userEmail ) {
	if ( token &&  email ) {
		if ( validateFileExist( `${ _baseDir }/tokens/${ tokenId }.json`) ) {
			try {
				console.log('[ authentication.validateToken ] - TRY ');
				const tokenReadMsg = await tokenService._read(token);
				
				console.log('[ authentication.validateToken ] - tokenService._read( token ) token read successfully ' );
				const tokenData = parseJsonToObject( tokenReadMsg.data );
				
				
				if (tokenData.expires - new Date() > 0) {
					console.log('[ authentication.validateToken ] - tokenData.expires > new Date() - token authorized ' );
					// Validates token: if exist (read from a file), received information is equal to toke's information, and
					// if time is not expired
					if (tokenData.email === email && tokenData.tokenId === token) {
						console.log('[ authentication.validateToken ] - Token fetched successfully ');
						return responseTemplate(200, 'Token fetched successfully', tokenData);
					} else {
						console.log('[ authentication.validateToken ] - ERROR: EACCESS ');
						return errorTemplate('EACCESS', 'User or Token have invalid values [ authentication.validateToken ]');
					}
				} else {
					console.log('[ authentication.validateToken ] - ERROR: ETIME - Token expired ');
					return errorTemplate('ETIME', 'Token expired [ authentication.validateToken ]');
				}
			} catch (error) {
				console.log('[ authentication.validateToken ] - tokenService._read( token ) - ERROR');
				console.log('[ authentication.validateToken ] - ERROR: ', error);
				console.log(`Error [ authentication.validateToken - errorCode: ${ error.code || 'Bad Request' } -  statusCode: ${ error.statusCode || 400 }`);
				return errorTemplate(error.code || 'Bad Request', `[ users.userPost ]`, error.statusCode || 400);
			}
		} else {
			console.log('[ authentication.validateToken ] Provided tokenId does not exist ');
			return errorTemplate( 'ENOENT', 'Provided tokenId does not exist')
		}
	} else {
		console.log( '[ authentication.validateToken ] - ERROR: EINVAL - Required fields missing or they were invalid ' );
		return errorTemplate( 'EINVAL', 'Required fields missing or they were invalid [ authentication.validateToken ]' );
	}
};


module.exports  = {
	validateToken,
};
