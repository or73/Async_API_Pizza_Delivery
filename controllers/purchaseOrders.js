/*
* Order Controller
*/

// Dependencies
const config         = require( '../config/config' );
const apiKey        = config.mailgun.apiKey;
const domain        = config.mailgun.domain;
const stripe        = require( 'stripe' )( config.stripe.secret );
const mailgun       = require( 'mailgun-js' ) ( { apiKey, domain } );
stripe.setApiVersion= config.stripe.apiVersion;

const {
	createHTMLMessage,
	createRandomString,
	errorTemplate,
	parseJsonToObject,
	parseObjectToJson,
	responseTemplate,
	validateEmail,
	validateStatusCodeOk,
	validateString
}                       = require( '../lib/helpers' );
const { validateToken } = require( '../lib/authentication' );

const dataService       = require( '../services/data' );

// Services
const shopCartService   = dataService( 'shoppingCarts' );
const poService         = dataService( 'purchaseOrders' );
const tokenService      = dataService( 'tokens' );
const userService       = dataService( 'users' );

/*
* Order - POST
* Required data: headers → token
 *               queryStringObject → email
* Optional data: None
* Procedure description:    1. Validate tokenId and email are valid strings
*                           2. Validate user exists
*                           3. Validate token is valid
*                           4. Validates if shoppingCard has an item list
*                           5. Validate payment with 'Stripe'
*                           6. Create order object
*                           7. Send email with order's details
*                           8. Stores order object
* */
const orderPost = async data => {
	console.log( ' Purchase Order '.bgRed.black.bold, ' POST '.bgCyan.grey.bold );
	const headers           = data.headers;
	const queryStringObject = data.queryStringObject;
	const tokenId = (validateString(headers.token) && headers.token.length === 20) ? headers.token : false;
	const email = (validateString(queryStringObject.email) && validateEmail(queryStringObject.email)) ? queryStringObject.email : false;

	if (tokenId && email) {
		// validate if PO already exists
		const poValMsg  = await poService._read( email );
		console.log( '[ purchaseOrders.orderPost ] - poValMsg: ', poValMsg );
		if ( !validateStatusCodeOk( poValMsg ) ) {
			// validate if user exist
			const userServMsg = await userService._read(email);
			console.log( '[ purchaseOrders.orderPost ] - userServMsg: ', userServMsg );
			if ( validateStatusCodeOk( userServMsg ) ) {
				const tokenServMsg = await tokenService._read(tokenId);
				console.log( '[ purchaseOrders.orderPost ] - tokenServMsg: ', tokenServMsg );
				if (validateStatusCodeOk(tokenServMsg)) {   // validate if token is valid
					// Validate if user list contains items
					const itemListMsg = await shopCartService._itemList(email);
					console.log( '[ purchaseOrders.orderPost ] - itemListMsg: ', itemListMsg );
					if (validateStatusCodeOk(itemListMsg)) {
						const orderId = createRandomString(20);
						if (orderId) {
							const itemListData = parseJsonToObject( itemListMsg.data );
							const orderDate = new Date();
							const orderObj = {
								id: true,
								shoppingCartId: email,
								items: parseJsonToObject(itemListData.items),
								total: itemListData.total,
								paymentMethod: '',
								currency: 'USD',
								authorization: false,
								authorizationDate: `${ orderDate.getDate() }/${ orderDate.getMonth() }/${ orderDate.getFullYear() } ${ orderDate.getHours() }:${ orderDate.getMinutes() }:${ orderDate.getSeconds() }`,
							};
							console.log( '[ purchaseOrders.orderPost ] - Everything is WELL until now ' );
							/*
							* Stripe - START
							* */
							// Create a new customer and then a new charge for that customer
							let customer    = await stripe.customers.create( { email, source: 'tok_visa', description: `Customer for ${ email }` } );
							console.log( '[ purchaseOrders.orderPost ] - customer: ', customer );
							if ( customer ) {
								console.log( '[ purchaseOrders.orderPost ] - typeof itemListData.total: ', typeof itemListData.total );
									let customerChr = await stripe.charges.create({
										amount: itemListData.total,
										currency: 'usd',
										description: `Charge for ${ email }`,
										customer: customer.id,
									});
									console.log( '[ purchaseOrders.orderPost ] - customerChr: ', customerChr );
									if ( customerChr ) {
										orderObj.id = customerChr.id;
										orderObj.authorization = true;
										orderObj.country = customerChr.source.country;
										orderObj.items  = itemListData.items;
										orderObj.object = customerChr.source.object;
										orderObj.paymentMethod = customerChr.source.brand;
										orderObj.last4 = customerChr.source.last4;
										console.log( '[ purchaseOrders.orderPost ] - OrderObj: ', orderObj );
										console.log( '[ purchaseOrders.orderPost ] - Online payment was made successfully ' );
										
										/*
										* Mailgun - START
										* */
										const emailMessage = {
											from: 'director@grizzlygroup.co',
											to: 'oreyesc@gmail.com',
											subject: 'Order Test',
											html: createHTMLMessage(orderObj),
										};
										// try {
										mailgun.messages().send(emailMessage, async (err, body) => {
											if (err) {
												return errorTemplate('EINVAL', err.message + ' Something wrong with Purchase Order [ purchaseOrder.orderPost]');
											} else {
												console.log( '[ purchaseOrders.purchaseOrderPost ] - body: ', body );
											}
										});
										
										const poMsg = await poService._create(email, orderObj);
										if (validateStatusCodeOk(poMsg)) {
											return responseTemplate(201, 'The Purchase Order was generated, the electronic payment made, and the email was sent successfully', poMsg.data );
										} else {
											poMsg.message += ' Something wrong generating Purchase Order [ purchaseOrder.orderPost ]';
											return errorTemplate(poMsg);
										}
										// } catch (error ) {
										// 	throw errorTemplate('EINVAL', error.message + ' Email was not sent [ purchaseOrder.orderPost]');
										// }
										/*
										* Mailgun message - END
										* */
										// return responseTemplate( 201, 'Stripe customer charge was done successfully' );
									} else {
										console.log( '[ purchaseOrders.orderPost ] - ERROR - ENODATA: Stripe customer charge was not done ' );
										return errorTemplate( 'ENODATA', 'Stripe customer charge was not made')
									}
							} else {
								console.log( '[ purchaseOrders.orderPost ] - ERROR - ENODATA: Stripe online payment processing was not done ' );
								return errorTemplate( 'ENODATA', 'Stripe online payment processing was not made');
							}
							// await stripe.customers
							// 	.create({email})
							// 	.then( customer => {
							// 		return stripe.customers.createSource(customer.id, {
							// 			source: 'tok_visa'
							// 		});
							// 	}).then( source => {
							// 	return stripe.charges.create({
							// 		amount: itemListData.total,
							// 		currency: 'usd',
							// 		customer: source.customer
							// 	});
							// }).then( charge => {
							// 	// New charge created on a new customer
							// 	orderObj.id = charge.id;
							// 	orderObj.authorization = true;
							// 	orderObj.country = charge.source.country;
							// 	orderObj.object = charge.source.object;
							// 	orderObj.paymentMethod = charge.source.brand;
							// 	orderObj.last4 = charge.source.last4;
							// 	return orderObj;
							// }).then( orderObjData => {
							// 		/*
							// 		* Mailgun - START
							// 		* */
							// 		const emailMessage = {
							// 			from: 'director@grizzlygroup.co',
							// 			to: 'oreyesc@gmail.com',
							// 			subject: 'Order Test',
							// 			html: createHTMLMessage(orderObj),
							// 		};
							// 		try {
							// 			mailgun.messages().send(emailMessage, (err, body) => {
							// 				if (err) {
							// 					return errorTemplate('EINVAL', err.message + ' [ purchaseOrder.orderPost]');
							// 				} else {
							// 					boolTest    = true;
							// 					return responseTemplate(201, 'Order was generated', orderObjData);
							// 				}
							// 			});
							// 		} catch (e) {
							// 			throw errorTemplate('EINVAL', err.message + ' [ purchaseOrder.orderPost]');
							// 		}
							// 		/*
							// 		* Mailgun message - END
							// 		* */
							// 	})
							// 	.catch(function (err) {
							// 		// Deal with an error
							// 		throw responseTemplate('EINVAL', err.message);
							// 	});
							/*
							* Stripe - END
							* */
							// if ( boolTest ) {
							// 	const poMsg = await poService._create(email, parseObjectToJson(orderObj));
							// 	if (validateStatusCodeOk(poMsg)) {
							// 		return responseTemplate(201, 'Purchase Order created successfully', orderObj);
							// 	} else {
							// 		poMsg.message += ' [ purchaseOrder.orderPost ]';
							// 		throw errorTemplate(poMsg);
							// 	}
							// } else {
							// 	return errorTemplate();
							// }
						} else {
							return errorTemplate('ENODATA', 'Order id could not be generated  [ purchaseOrders.orderPost]');
						}
					} else {
						itemListMsg.message += ' Invalid token [ purchaseOrders.orderPost]';
						return itemListMsg;
					}
				} else {
					tokenServMsg.message += ' Could not fetch items from menu [ purchaseOrders.orderPost]';
					return tokenServMsg;
				}
			} else {
				userServMsg.message += ' User does not exist [ purchaseOrders.orderPost]';
				return userServMsg;
			}
		} else {
			return errorTemplate( 'EEXIST', 'Purchase Order already exists [ purchaseOrders.orderPost ]' );
		}
	} else {
		return errorTemplate('EINVAL', 'Missing or invalid required fields [ purchaseOrders.orderPost]');
	}
};

/*
* Order - GET
* Required data: headers → token, email
* Optional data: None
* Procedure description:    1. Validate tokenId and email are valid strings
*                           2. Validate user exists
*                           3. Validate token is valid
*                           4. Read and Validate Purchase Order
* */
const orderGet  = data => {
	console.log( ' Purchase Order '.bgRed.black.bold, ' GET '.bgCyan.grey.bold );
	const headers           = data.headers;
	const queryStringObject = data.queryStringObject;
	const email     = validateString( queryStringObject.email ) && validateEmail( queryStringObject.email ) ? queryStringObject.email : false;
	const token     = validateString( headers.token ) && ( headers.token.length === 20 ) ? headers.token : false;
	
	// Validate email and token
	if ( email && token ) {
		// Validate user exists
		const userValMsg    = userService._read( email );
		if ( validateStatusCodeOk( userValMsg ) ) {
			// validate token
			const tokenValMsg = validateToken(token, email);
			if (validateStatusCodeOk(tokenValMsg)) {
				const readPOMsg = poService._read(email);
				if (validateStatusCodeOk(readPOMsg)) {
					return responseTemplate(200, 'Order fetched successfully', parseJsonToObject(readPOMsg.data));
				} else {
					readPOMsg.message += ' [ purchaseOrders.orderGet ]';
					return readPOMsg;
				}
			} else {
				tokenValMsg.message += ' [ purchaseOrders.orderGet ]';
				return tokenValMsg;
			}
		} else {
			userValMsg.message  += ' [ purchaseOrders.orderGet]';
			return userValMsg;
		}
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields.' );
	}
};

module.exports = {
	post    : orderPost,
	get     : orderGet,
};
