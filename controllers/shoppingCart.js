/*
* ShoppingCart controller
* */

// Dependencies
const { createRandomString,
	errorTemplate,
	parseJsonToObject,
	parseObjectToJson,
	responseTemplate,
	validateEmail,
	validateString,
	validateStatusCodeOk,
	validateValueInArray }  = require( '../lib/helpers' );
const { validateToken }     = require( '../lib/authentication' );
const dataService           = require( '../services/data' );

// Instantiating services
const menuService           = dataService( 'menus' );
const shoppingCartService   = dataService( 'shoppingCarts' );


/*
* ShoppingCart  - POST
* Required data: headers → email, token
*                queryStringObject → item, qtty
* Optional data: None
* Procedure description:   1. Validate email, token, item, qtty
*                          2. Validate token
*                               If item && qtty                         If !item && !qtty
*                          3. Validate if item exists in menu        3. Validate Shopping Cart  exists
*                          4. Create new item object                 4. Create new Shopping Cart object
*                          5. Add new item object to Shopping Cart   5. Create new Shopping Cart
*
* Description                    Path
* Create a Shopping Cart         http://localhost:3000/shoppingCart
* Add an item to Shopping Cart   http://localhost:3000/shoppingCart?item=<itemName>&qtty=<itemQuantity>
* */
const shoppingCartPost  = async data => {
	console.log( ' Shopping Cart '.bgYellow.black.bold, ' POST '.bgCyan.grey.bold );
	const headers           = data.headers;
	const queryStringObject = data.queryStringObject;
	
	const email = ( validateString( headers.email ) && validateEmail( headers.email ) ) ? headers.email : false;
	const token = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;
	const item  = validateString( queryStringObject.item ) ? queryStringObject.item : false;
	const qtty  = validateString( queryStringObject.qtty ) ? parseInt( queryStringObject.qtty ) : false;
	
	if ( email && token ) {
		const valTokenMsg   = await validateToken( token, email );
		// validate if token exists
		if ( validateStatusCodeOk( valTokenMsg ) ) {
			if ( item && qtty ) {
				// validate if item exists
				const itemMenuMsg = await menuService._read( item );
				if ( validateStatusCodeOk( itemMenuMsg ) ) {
					const cartMsg       = await shoppingCartService._read( email );
					const itemMenuObj   = parseJsonToObject( itemMenuMsg.data );
					if ( validateStatusCodeOk( cartMsg ) ) {
						const cartItemObj = parseJsonToObject( cartMsg.data );
						// validates if item does not exist into shopping Cart
						if ( !validateValueInArray( item, cartItemObj.items ) ) {
							// const itemMenuObj = cartItemObj.items;
							const newItem = {   // Item to add to object array of items
								name: itemMenuObj.name,
								price: itemMenuObj.price,
								qtty,
								total: qtty * itemMenuObj.price,
							};
							const price = itemMenuObj.price;
							cartItemObj.items.push( newItem );
							cartItemObj.total += ( qtty * price );
							const itemObj = {
								id: cartItemObj.id,
								email: cartItemObj.email,
								items: cartItemObj.items,
								total: cartItemObj.total,
							};
							const itemUpdMsg    = await shoppingCartService._update( email, parseObjectToJson( itemObj ) );
							if ( validateStatusCodeOk( itemUpdMsg ) ) {
								return responseTemplate( 200, 'Product added to Shopping Cart, successfully', itemObj );
							} else {
								itemUpdMsg.message  += ' Shopping Cart could not be updated [ shoppingCart.shoppingCartPost ]';
								return itemUpdMsg; // errorTemplate( 'ENODATA', 'Item could not be added to Shopping Cart' );
							}
						} else {
							return errorTemplate( 'EEXIST', 'Item already exist in cart... use update option [ shoppingCart.shoppingCartPost ]');
						}
					} else {
						cartMsg.message += ' Shopping Cart could not be fetched[ shoppingCart.shoppingCartPost ]';
						return cartMsg; //  errorTemplate( 'ENODATA', 'Shopping cart was not found' );
					}
				} else {
					itemMenuMsg.message += ' Menu could not be read [ shoppingCart.shoppingCartPost ]';
					return itemMenuMsg; // errorTemplate( 'ENODATA', 'Item was not found');
				}
			} else if (!item && !qtty) {
				// validate if cart already exists
				// Shopping cart does not exist
				const shopCartMsg   = await shoppingCartService._read( email );
				if ( !validateStatusCodeOk( shopCartMsg ) ) {
					const cartId = createRandomString(20);
					const shoppingCartObj = {
						id: cartId,
						email,
						items: [],
						total: 0,
					};
					const shopCartCreateMsg = await shoppingCartService._create( email, shoppingCartObj );
					 if ( validateStatusCodeOk( shopCartCreateMsg ) ) {
						 return responseTemplate(200, 'Shopping Cart created successfully', shoppingCartObj);
					 } else {
					 	shopCartCreateMsg.message   += ' Shopping Cart could not be created [ shoppingCart.shoppingCartPost ]';
					    return shopCartCreateMsg; // errorTemplate(400, 'Shopping Cart could not be created');
					 }
				} else {
					shopCartMsg.message += ' Shopping Card could not be fetched [ shoppingCart.shoppingCartPost ]';
					return shopCartMsg; //errorTemplate(400, 'Shopping Cart already exists');
				}
			} else {
				return errorTemplate( 'EINVAL', `Missing or invalid required fields ( item, qtty ) [ 1 shoppingCart.shoppingCartPost ]` );
			}
		} else {
			valTokenMsg.message += ' Invalid Token [ shoppingCart.shoppingCartPost ]';
			return valTokenMsg; //errorTemplate( 403, `Unauthorized access ` );
		}
	} else {
		return errorTemplate( 'EINVAL', `Missing or invalid required fields [ 2 shoppingCart.shoppingCartPost ]` );
	}
};


/*
* ShoppingCart  - GET
* Required data: headers → email, token
*                queryStringObject → all
* Optional data: None
* Procedure description:   1. Validate email, token
*                          2. Validate token
*                                      If all                                   If !all
*                          3. Validate if Shopping Cart exists       3. Validate Shopping Cart exists
*                          4. Fetch list of Shopping Carts           4. Fetch Shopping Cart
*
* Description                    Path
* Fetch a Shopping Cart                          http://localhost:3000?id=<shoppingCartId>
* Fetch list of  all available Shopping Carts    http://localhost:3000?all
* */
const shoppingCartGet   = async data => {
	console.log( ' Shopping Cart '.bgYellow.black.bold, ' GET '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	const headers           = data.headers;
	
	const all   = (typeof queryStringObject.all === 'string' && queryStringObject.all.length === 0);
	const email = ( validateString( headers.email ) && validateEmail( headers.email ) ) ? headers.email : false;
	const token = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;
	
	// validate email && token
	if ( email && token ) {
		// validate token
		// validate if token exists
		const tokenExistMsg    = await validateToken( token, email );
		if ( validateStatusCodeOk( tokenExistMsg ) ) {
			// validate if id was provided
			if ( !all ) {
				// validate Shopping Cart exists
				const shoppingCartMsg = await shoppingCartService._read( email );
				if ( validateStatusCodeOk( shoppingCartMsg ) ) {
					return responseTemplate( 200, 'Shopping Cart Item fetched successfully', parseJsonToObject( shoppingCartMsg.data ) );
				} else {
					shoppingCartMsg.message += ' Shopping Cart could not be fetched [ shoppingCart.shoppingCartGet ]';
					return shoppingCartMsg; // errorTemplate(400, 'Shopping Cart does not exist');
				}
			} else if ( all ) {
				const shoppingCartListMsg = await shoppingCartService._namesOfAllFiles( );
				const shopCartObj   = shoppingCartListMsg.data;
				console.log( '[ shoppingCart.shoppingCartGet ] - shopCartObj: ', shopCartObj );
				if ( validateStatusCodeOk( shoppingCartListMsg ) ) {
					return responseTemplate( 200, 'Shopping Cart list fetched successfully', shopCartObj );
				} else {
					shoppingCartListMsg.message += ' List of Shopping Carts could not be fetched[ shoppingCart.shoppingCartGet ]';
					return shoppingCartListMsg;
				}
			} else {
				return errorTemplate( 'EINVAL', `Missing or invalid required fields [ 1 shoppingCart.shoppingCartGet ]`);
			}
		} else {
			tokenExistMsg.message   += ' Invalid Token [ shoppingCart.shoppingCartGet ]';
			return tokenExistMsg;  // contains an error response
		}
	} else {
		return errorTemplate( 'EINVAL', `Required fields missing or they were invalid [ 2 shoppingCart.shoppingCartGet ]`);
	}
};


/*
* ShoppingCart  - PUT
* Required data: headers → email, token
*                payload → items
*                queryStringObject → id
* Optional data: None
* Procedure description:   1. Validate email, token, shoppingCartId, items
*                          2. Validate token
*                          3. Validate if ShoppingCartId exists
*                          4. Update each item in Shopping Cart
*
* Description                                            Path
* Update an item or a list of items from Shopping List   http://localhost:3000?id=<shoppingCartId>
* */
const itemShoppingCartPut  = async data => {
	console.log( ' Shopping Cart '.bgYellow.black.bold, ' PUT '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	const payload           = data.payload;
	const headers           = data.headers;
	
	const items             = ( typeof payload.items === "object" && payload.items.length > 0 ) ? payload.items : false;
	const shoppingCartId    = ( validateString( queryStringObject.id ) && validateEmail( queryStringObject.id ) ) ? queryStringObject.id : false;
	const token             = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;
	const email             = ( validateString( headers.email ) && validateEmail( headers.email ) ) ? headers.email : false;
	
	// validate email && token
	if ( shoppingCartId && token && email && email === shoppingCartId && items ) {
		// validate token
		// validate if token exists
		const tokenExistMsg    = await validateToken( token, email );
		if ( validateStatusCodeOk( tokenExistMsg ) ) {
			// validate item exists
			const shoppingCartMsg  = await shoppingCartService._read( shoppingCartId );
			if ( validateStatusCodeOk( shoppingCartMsg) ) {
				const shoppingCartData  = parseJsonToObject( shoppingCartMsg.data ); // data collected from DB
				const shoppingCartItems = shoppingCartData.items;   // items, from data collected from DB
				// validate if shopping Cart contains items and delete each one from the items list
				
				// position of current object
				let counter     = 0;
				let toSubtract  = 0;
				let toAdd       = 0;
				
				// List of items received from user
				const itemsName = [];
				items.forEach( item => {
					itemsName.push( item.name );
				} );
				
				// go through array of items of shopping cart
				shoppingCartItems.forEach( itemShoppingCart => {
					// validate if provided item is equal to
					if ( validateValueInArray( itemShoppingCart.name, itemsName ) ) {
						// find itemShoppingCart and update values with itemsName item, values to update
						items.forEach( item => {
							if ( ( item.name ).localeCompare( itemShoppingCart.name ) === 0 ) {
								itemShoppingCart.qtty   = item.qtty;
								toSubtract += itemShoppingCart.total;
								itemShoppingCart.total  = itemShoppingCart.price * itemShoppingCart.qtty;
								toAdd += itemShoppingCart.total;
								return true;
							}
						} );
					}
					counter++;
				} );
				shoppingCartData.total += ( toAdd - toSubtract );
				shoppingCartData.items  = shoppingCartItems;
				const shoppingServUpdateMsg = await shoppingCartService._update( shoppingCartId, parseObjectToJson( shoppingCartData ) );
				if ( validateStatusCodeOk( shoppingServUpdateMsg ) ) {
					return responseTemplate( 201, 'Shopping Cart was updated successfully', shoppingCartData );
				} else {
					shoppingServUpdateMsg.message   += ' Shopping Cart could not be updated [ shoppingCart.shoppingCartPut ]';
					return shoppingServUpdateMsg;
				}
			} else {
				shoppingCartMsg.message += ' Shopping Cart could not be fetched [ shoppingCart.shoppingCartPut ]';
				return shoppingCartMsg;    // Contains an error message response
			}
		} else {
			tokenExistMsg.message   += ' Invalid Token [ shoppingCart.shoppingCartPut ]';
			return tokenExistMsg;  // Contains an error message response
		}
	} else {
		return errorTemplate( 'EINVAL', `Missing or invalid required fields ( shop Cart Id, items ) [ shoppingCart.shoppingCartPut ]` );
	}
};


/*
* ShoppingCart  - DELETE
* Required data: headers → email, token
*                payload → items
*                queryStringObject → id
* Optional data: None
* Procedure description:   1. Validate email, token, shoppingCartId, items
*                          2. Validate token
*                          3. Validate shoppingCartId exists
*                             If shoppingCardId && !items           If shoppingCartId && items
*                          3. Delete shoppingCart                   3. Delete each item (by qtty), from shopping Cart
*
* Description                                            Path
* Delete a Shopping List                                http://localhost:3000?id=<shoppingCartId>
* Delete an item or a list of items from Shopping List  http://localhost:3000?id=<shoppingCartId>
* */
const shoppingCartDelete  = async data => {
	console.log( ' Shopping Cart '.bgYellow.black.bold, ' DELETE '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	const payload           = data.payload;
	const headers           = data.headers;
	
	const items             = ( typeof payload.items === "object" && payload.items.length > 0 ) ? payload.items : false;
	const shoppingCartId    = ( validateString( queryStringObject.id ) && validateEmail( queryStringObject.id ) ) ? queryStringObject.id : false;
	const token             = ( validateString( headers.token ) && headers.token.length === 20 ) ? headers.token : false;
	const email             = ( validateString( headers.email ) && validateEmail( headers.email ) ) ? headers.email : false;
	
	// validate email && token
	if ( shoppingCartId && token && email && email === shoppingCartId ) {
		// validate token
		// validate if token exists
		const tokenExistMsg    = await validateToken( token, email );
		if ( validateStatusCodeOk( tokenExistMsg ) ) {
			// validate if id was provided
			if (shoppingCartId && !items ) {
				// validate Shopping Cart exists
				const delShoppingCartMsg   = await shoppingCartService._delete( shoppingCartId );
				if ( validateStatusCodeOk( delShoppingCartMsg ) ) {
					return responseTemplate( 200, 'Shopping Cart deleted successfully', {} );
				} else {
					delShoppingCartMsg.message  += ' Shopping Cart could not be deleted [ shoppingCart.shoppingCartDelete ]';
					return delShoppingCartMsg;     // Contains error message response
				}
			} else if (shoppingCartId && items ) {
				// shoppingCart   --> shopping Cart service, _read, message
				// items   --> items array to be deleted
				// shoppingCartData   --> items list of shoppingCart object
				// itemsDeleted   --> amount of items deleted in shoppingCart
				// arrayItems   --> list of names of items list in shoppingCartData
				
				// validate item exists
				const shoppingCartMsg  = await shoppingCartService._read( shoppingCartId );
				if ( validateStatusCodeOk( shoppingCartMsg) ) {
					const shoppingCartData  = JSON.parse( shoppingCartMsg.data );
					const shoppingCartItems = shoppingCartData.items;
					
					// validate if shopping Cart contains items and delete each one from the items list
					// list of items in shopping cart
					let amount          = 0;
					// position of current object
					let positionsArray  = [];
					let counter         = 0;
					let itemsDeleted    = 0;
					
					// go through array of items of shopping cart
					shoppingCartItems.forEach( itemShoppingCart => {
						// validate if provided item is equal to
						if ( validateValueInArray( itemShoppingCart.name, items ) ) {
						// 	// load items amount
							amount  += itemShoppingCart.total;
							positionsArray.push( counter );
							itemsDeleted++;
						}
						counter++;
					} );
					if ( itemsDeleted > 0 ) {
						// sort items array positions to be deleted
						positionsArray.sort((a, b) => b - a);
						
						// Delete desired items
						for (let i = 0; i < positionsArray.length; i++) {
							let index = positionsArray[i];
							shoppingCartItems.splice(index, 1);
						}
						
						// Create new object
						const newItemObj = {
							"id": shoppingCartData.id,
							"email": shoppingCartId,
							"items": shoppingCartItems,
							"total": shoppingCartData.total - amount,
						};
						const updateShoppingCart = await shoppingCartService._update( shoppingCartId, JSON.stringify(newItemObj));
						if (validateStatusCodeOk(updateShoppingCart)) {
							return responseTemplate(201, 'ShoppingCart items deleted successfully', newItemObj);
						} else {
							updateShoppingCart.message  += ' Shopping Cart item(s) could not be deleted [ shoppingCart.shoppingCartDelete ]';
							return updateShoppingCart // errorTemplate( 400, 'File could not be updated' );
						}
					} else {
						return errorTemplate( 'Not Acceptable', 'Not items found in Shopping Cart [ shoppingCart.shoppingCartDelete ]', 406 );
					}
				} else {
					shoppingCartMsg.message += '  Shopping Cart could not be fetched [ shoppingCart.shoppingCartDelete ]';
					return shoppingCartMsg;    // Contains an error message response
				}
			} else {
				return errorTemplate( 'EINVAL', `Missing or invalid required fields ( shopping Cart Id, items ) [ 1 shoppingCart.shoppingCartDelete ]` );
			}
		} else {
			tokenExistMsg.message   += ' Invalid Token [ shoppingCart.shoppingCartDelete ]';
			return tokenExistMsg;  // Contains an error message response
		}
	} else {
		return errorTemplate( 'EINVAL', `Missing or invalid required fields ( Shopping Cart Id ) [ 2 shoppingCart.shoppingCartDelete ]` );
	}
};


module.exports  = {
	post    : shoppingCartPost,
	get     : shoppingCartGet,
	put     : itemShoppingCartPut,
	delete  : shoppingCartDelete,
};
