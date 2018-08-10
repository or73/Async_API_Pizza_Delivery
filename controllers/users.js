/*
* Users controller
* */

// Dependencies
const {
	createHash,
	createRandomString,
	errorTemplate,
	responseTemplate,
	parseJsonToObject,
	validateEmail,
	validateStatusCodeOk,
	validateString, }   = require( '../lib/helpers' );
const { validateToken } = require( '../lib/authentication' );
const dataService       = require( '../services/data' );
const colors            = require( 'colors' );

// Instantiating services
const shoppingCartService   = dataService( 'shoppingCarts' );
const tokenService          = dataService( 'tokens' );
const userService           = dataService( 'users' );

/*
* User  - POST
* Required data: payload → email, address, password, name
* Optional data: None
* Description:  1. Validates email, password, address and name
*               2. Creates user object
*               3. Generate tokenId
*               4. Generate token timer
*               5. Validates user exists
*               6. Create user and token
*
* * All data is required to create the user, and two more fields are filled automatically:
*        shoppingCartId: false   --> is a boolean, is true if the user has a shoppingCart
*        ordersBckp: []          --> will contain all the purchase purchaseOrders made by the user
* */
const userPost  = async data => {
	console.log( ' Users '.bgBlack.red.bold, ' POST '.bgCyan.grey.bold );
	const payload   = data.payload;
	const email     = ( validateString( payload.email ) && validateEmail( payload.email ) ) ? payload.email : false;
	const address   = validateString( payload.address ) ? payload.address : false;
	const password  = validateString( payload.password ) ? createHash( payload.password ) : false;
	const name      = validateString( payload.name ) ? payload.name : false;
	
	let userData = {};
	
	if (email && address && password && name) {
		// Validates if user already exists
		console.log( '[ users.userPost ] - START ' );
		
		console.log( '[ users.userPost ] - userService._create( email )  - TRY' );
		userData = {email, address, name, password, shoppingCartId: false, ordersBckp: []};			
		try {
			const responseUser = await userService._create(email, userData);
			console.log( `[ users.userPost ] - userService._create - ${ email } User has been created` );
			if ( validateStatusCodeOk( responseUser ) )	{
				delete userData.password;
				const tokenId = createRandomString(20);
				let tokenObj = {};
				if ( tokenId ) {
					const expires = Date.now() + 1000 * 60 * 60 * 24;    // 1000 * 60 = 1 sec   (1000 * 60) * 60 1 hour   (1000 * 60) * 60 * 24 = 24 hours
					tokenObj = {
						tokenId,
						email,
						expires,
					};
				}
				const responseToken = await tokenService._create( tokenId, tokenObj );
				console.log( `[ users.userPost ] - userService._create - A new token has been created for ${ email } User` );
				delete userData.password;
				if ( validateStatusCodeOk( responseToken ) ) return responseTemplate(201, `User ${ email } and a token  were created successfully`, userData );
				else return responseTemplate(201, `User ${ email } was created successfully, and a token could not be created`, userData );
			}
			else return responseUser;
		} catch ( error ) {
					console.log( '[ users.userPost ] - error: ', error );
					return errorTemplate( error.code || 'Bad Request', ` [ users.userPost ]`, error.statusCode || 400 );
		} 
	} else {
		return errorTemplate( 'EINVAL', 'Required fields missing or invalid' );
	}
};


/*
* User - GET
* Required data: queryStringObject → email
*                headers → token
* Optional data: None
* Description:  1. Validate email and token
*               2. Validate token
*               3. Validates user exists
*               4. Return user object or Error message
*
* Two operations are available:
*              1. Get information of one user   --> retrieves information of provided mail's user
*              2. Get a list of existing users  --> retrieves a list of users
*
*      Description                            Path
* Get information of one user    http://localhost:3000/users?valid@email.com
* Get a list of existing users   http://localhost:3000/users?all
* */
const userGet   = async data => {
	console.log( ' Users '.bgBlack.red.bold, ' GET '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	const headers           = data.headers;
	const email     = ( validateString( queryStringObject.email ) && validateEmail( queryStringObject.email ) ) ? queryStringObject.email : false;
	const token     = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;
	const all       = ( typeof queryStringObject.all === 'string' && queryStringObject.all.length === 0);
	const tokenEmail = ( validateString( headers.email ) && validateEmail( headers.email ) ) ? headers.email : false;
	
	if ( email && token && !all ) {
		try {
			const valToken  = await validateToken( token, email );
			console.log('[ users.userGet ] - valToken: ', valToken );
			if ( validateStatusCodeOk( valToken ) ) {
				console.log('[ users.userGet ] - Token has been validated...');
				const readUser = await userService._read(email);
				if ( validateStatusCodeOk( readUser ) ) {
					return responseTemplate(200, 'User fetched successfully', readUser);
				} else {
					console.log(`[ users.userGet ] - The ${ email } user could not be fetched: `, readUser );
					return readUser;
				}
			} else {
				console.log(`[ users.userGet ] - The token is not valid - valToken: `, valToken );
				return valToken;
			}
		} catch ( error ) {
			error.message   += ' [ users.userGet ]';			
			console.log( '[ users.userGET ] - ERROR: ', error );
			console.log( `Error [ users._userGet - errorCode: ${ error.code || 'EACCESS' } -  statusCode: ${ error.statusCode || 403 }` );
			return errorTemplate( error.code || 'EACCESS', `[ users.userGet ]`, error.statusCode || 403 );
		}
	} else if ( all && tokenEmail ) {    // List all users, if a token is provided, but not an email
		try {
			const valToken = await validateToken(token, tokenEmail);
			console.log( '[ users.userGET ] - valToken: ', valToken );
			if (validateStatusCodeOk(valToken)) {
				console.log( '[ users.userGET ] - Token has been validated: ', valToken );
				const usersListDetails = await userService._contentOfAllFiles();				
				const usersList = [];
				usersListDetails.data.forEach(userObject => {
					const infoObj = JSON.parse(userObject);
					usersList.push( infoObj );
				});
				console.log( '[ users.userGET ] - usersList fetched successfully ' );
				return responseTemplate(200, 'Users list fetched successfully', usersList);
			} else {
				console.log( '[ users.userGET ] - ERROR - Token not valid was provided' );
				return errorTemplate('EACCESS', 'Token is not valid [ users.userGet ]');
			}
		} catch (error) {
			error.message += ' [ users.userGet ]';
			console.log('[ users.userGET ] - ERROR: ', error);
			console.log(`Error [ users._userPost - errorCode: ${ error.code || 'EACCESS' } -  statusCode: ${ error.statusCode || 403 }`);
			return errorTemplate(error.code || 'EACCESS', `[ users.userPost ]`, error.statusCode || 403);
		}
	} else {
		console.log( '[ users.userGet ] - ERROR: EINVAL - Missing or invalid required fields' );
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields [ users.userGet ]' );
	}
};


/*
* User - UPDATE
* Required data: payload → address, password, name
*                queryStringObject → email
*                headers → token
* Optional data: None
* Procedure description:  1. Validate token
*                         2. Validate if user exists in database/file
*                         3. Update user data
*
* email cannot be updated, because it is used as id in several parts of the application
* */
const userUpdate    = async data => {
	console.log( ' Users '.bgBlack.red.bold, ' PUT '.bgCyan.grey.bold );
	const payload           = data.payload;
	const queryStringObject = data.queryStringObject;
	const headers           = data.headers;
	
	const email     = ( validateString( queryStringObject.email ) && validateEmail( queryStringObject.email ) ) ? queryStringObject.email : false;
	const address   = validateString( payload.address ) ? payload.address : false;
	const password  = validateString( payload.password ) ? createHash( payload.password ) : false;
	const name      = validateString( payload.name ) ? payload.name : false;
	const token     = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;
	const emailBool = validateString( payload.email ) ? payload.email : false;
	
	// Fields authorized to modify: name, address, password
	if ( !emailBool && ( email || address || password || name ) ) {
		const tokenValid    = await validateToken( token, email );
		if ( validateStatusCodeOk( tokenValid ) ) {
			// Read current stored information of user
			const userDataMsg  = await userService._read( email );
			if ( validateStatusCodeOk( userDataMsg ) ) {
				const userDataJSON = parseJsonToObject( userDataMsg.data );				
				// If none information is new, then send a message of none information was modified, because none information was new
				let auxBool = false;
				if ( userDataJSON.name.localeCompare( name ) !== 0 || 
					userDataJSON.password.localeCompare( password ) !== 0 || 
					userDataJSON.address.localeCompare( address ) !== 0 ) auxBool = true;
				
				if ( auxBool ) {
					// Stores a new user Object with all modified fields
					const userDataObj = {
						address         : address || userDataJSON.address,
						password        : password || userDataJSON.password,
						name            : name || userDataJSON.name,
						email,
						shoppingCartId  : userDataJSON.shoppingCartId,
						ordersBckp      : userDataJSON.ordersBckp,
					};
					const userServUpdMsg = await userService._update(email, userDataObj );
					if (validateStatusCodeOk(userServUpdMsg)) {
						return responseTemplate(200, `User updated successfully`, userDataObj);
					} else {
						userServUpdMsg.message += ' [ users.userUpdate]';
						return userServUpdMsg; // errorTemplate( 'ENODATA', 'User has not been updated' );
					}
				} else {
					return errorTemplate( 'ENODATA', `${ email } user data could not be updated, because none information new was sent`);
				}
			} else {
				userDataMsg.message += ' [ users.userUpdate]';
				return userDataMsg;  //errorTemplate( 'ENODATA', 'User not found' );
			}
		} else {
			tokenValid.message  += ' [ users.userUpdate]';
			return tokenValid;// errorTemplate( 'EACCESS' );
		}
	} else if ( payload.email ) {
		return errorTemplate( 'EPERM', '[ users.userUpdate ] Email cannot be updated [ users.userUpdate]' );
	} else if ( !email ) {
		return errorTemplate( 'EACCESS', '[ users.userUpdate ] Email is required [ users.userUpdate]' );
	} else if ( !token ) {
		return errorTemplate( 'EACCESS', '[ users.userUpdate ] Token is required [ users.userUpdate]' );
	} else {
		return errorTemplate( 'EINVAL', '[ users.userUpdate ] Missing or invalid required fields [ users.userUpdate]' );
	}
};


/*
* User - DELETE
* Required data: queryStringObject → email
*                headers → token
* Optional data: None
* Procedure description:  1. Validate token
*                         2. Validate user exists
*                         3. Delete token, delete shoppingCart (if exists in user), delete user
* */
const userDelete  = async data => {
	console.log( ' Users '.bgBlack.red.bold, ' DELETE '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	const headers           = data.headers;
	
	const email     = ( validateString( queryStringObject.email ) && validateEmail( queryStringObject.email ) ) ? queryStringObject.email : false;
	const token     = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;

	if ( email && token ) {
		const tokenValidMsg   = await validateToken( token, email );
		// Validate if token file exist
		if ( validateStatusCodeOk( tokenValidMsg ) ) {
			const tokensServMsg    = await tokenService._read( token );
			if ( validateStatusCodeOk( tokensServMsg ) ) {
				const usersReadMsg  = await userService._read( email );
				if ( validateStatusCodeOk( usersReadMsg) ) {
					const tokenServDel  = await tokenService._delete( token );
					if ( validateStatusCodeOk( tokenServDel ) ) {
						const usersShoppingCartId   = parseJsonToObject( usersReadMsg.data ).shoppingCartId;
						const delShoppingCartMsg    = await shoppingCartService._delete( email );
						if ( validateStatusCodeOk( delShoppingCartMsg ) || !usersShoppingCartId ) {
							const userServDelMsg   = await userService._delete( email );
							if ( validateStatusCodeOk( userServDelMsg ) ) {
								return responseTemplate( 200, `User deleted successfully`, {} );
							} else {
								userServDelMsg.message  += ' [ users.userDelete]';
								return userServDelMsg;  // errorTemplate( 'EPERM', `User associated with ${ email }, has not been deleted` );
							}
						} else {
							delShoppingCartMsg.message  += ' [ users.userDelete]';
							return delShoppingCartMsg;
						}
					} else {
						tokenServDel.message    += ' [ users.userDelete]';
						return tokenServDel; // errorTemplate( 'EPERM', `User associated with ${ email } does not exist` );
					}
				}
				else {
					usersReadMsg.message    += ' [ users.userDelete]';
					return usersReadMsg; // errorTemplate( 'EPERM', `Token associated with ${ email } email, has not been deleted` );
				}
			} else {
				tokensServMsg.message   += ' [ users.userDelete]';
				return tokensServMsg;
			}
		}  else {
			tokenValidMsg.message   += ' [ users.userDelete]';
			return tokenValidMsg;
		}
	} else if ( !token) {
		return errorTemplate( 'EACCESS', ' [ users.userDelete]' );
	}  else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields [ users.userDelete]' );
	}
};


module.exports  = {
	post    : userPost,
	get     : userGet,
	put     : userUpdate,
	delete  : userDelete,
};
