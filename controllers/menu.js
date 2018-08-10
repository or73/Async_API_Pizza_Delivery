/*
* Menu controller
* */

// Dependencies
const { createRandomString,
	errorTemplate,
	parseJsonToObject,
	responseTemplate,
	validateEmail,
	validateStatusCodeOk,
	validateString }    = require( '../lib/helpers' );
const dataService       = require( '../services/data' );
const { validateToken } = require( '../lib/authentication' );

// Instantiating services
const menuService           = dataService( 'menus' );

/*
* Item  - POST
* Required data: payload → name and price
* Optional data: None
* Procedure description:  1. Validate name and price
*                         2. Validate menu exists
*                         3. Generate item id, randomly
*                         4. Create item object
*                         5. Add item object to menu
* */
const menuItemPost  = async data => {
	console.log( ' Menu '.bgBlue.black.bold, ' POST '.bgCyan.grey.bold );
	const payload   = data.payload;
	const name      = validateString( payload.name ) ? payload.name : false;
	const price     = ( typeof payload.price === 'number' && payload.price > 0 ) ? payload.price : false;
	
	if ( name && price ) {  // validate fields
		const menuAns  = await menuService._read( name );
		if ( !validateStatusCodeOk( menuAns ) ) { // validate if item already exist
			const itemId = createRandomString(20);
			if (itemId) {
				const itemData = { id: itemId, name, price };
				const menuCreate = await menuService._create( name, itemData );
				if (validateStatusCodeOk( menuCreate ) ) {
					return responseTemplate( 200, 'Item created successfully', itemData );
				} else {
					menuCreate.message  += ' Item could not be created [ menu.menuItemPost ]';
					return menuCreate;
				}
			} else {
				return errorTemplate( 'ENODATA', 'Item was not created [ menu.menuItemPost ]' );
			}
		} else {
			return errorTemplate( 'EEXIST', 'Item already exists [ menu.menuItemPost ]');
		}
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields ( name - price ) [ menu.menuItemPost ]' );
	}
};

/*
* Item - GET
* Required data: queryStringObject → name, all
* Optional data: None
* Procedure description:   1. Validates operation, query for one item of menu or list of items in menu
*                          2. Validates if item exist
*                          3. Retrieves menu information or list of items in menu
*
* Two operations are available:
*              1. Get information of one menu   --> retrieves information of provided menu
*              2. Get a list of existing menus  --> retrieves a list of menus
*      Description                              Path
* Get information of one item     http://localhost:3000/menus?name=<validItemName>
* Get a list of existing items    http://localhost:3000/menus?all
* */
const menuGet   = async data => {
	console.log( ' Menu '.bgBlue.black.bold, ' GET '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	const name              = validateString( queryStringObject.name) ? queryStringObject.name : false;
	const all               = (typeof queryStringObject.all === 'string' && queryStringObject.all.length === 0);
	
	if ( name ) {
		let itemDataMsg = await menuService._read( name);
		if ( validateStatusCodeOk( itemDataMsg) ) {
			let itemDataObj = parseJsonToObject( itemDataMsg.data );
			return responseTemplate( 200, 'Item fetched successfully', itemDataObj );
		} else {
			return errorTemplate( 'ENOENT', 'Menu item does not exist [ menu.menuGet ]' );
		}
	}  else if ( all ) {    // List all users, if a token is provided, but not an email
		const menuListMsg   = await menuService._contentOfAllFiles( );
		if ( validateStatusCodeOk( menuListMsg ) ) {
			console.log( '[ menu.menuGet ] - menuListMsg: ', menuListMsg );
			const menuListData  = menuListMsg.data ;
			let itemsList = [];
			menuListData.forEach( itemObject => {
				const infoObj = parseJsonToObject( itemObject );
				const newItemObj = {
					name    : infoObj.name,
					price   : infoObj.price,
				};
				itemsList.push(newItemObj);
				console.log( '[ menu.menuGet ] - itemList: ', itemsList );
			});
			return responseTemplate( 200, 'List of menu items fetched successfully', itemsList );
		} else {
			return errorTemplate( 'ENODATA', 'Menu items list was not fetched [ menu.menuGet ]' );
		}
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields ( item name ) [ menu.menuGet ]' );
	}
};

/*
* Item - UPDATE
* Required data: headers → email, token
*                payload → price
*                queryStringObject → name
* Optional data: None
* Procedure description:   1. Validates itemName, price, and token
*                          2. Validates token
*                          3. Validates menu exists
*                          4. Generate new menu object, with all new values, and previous values, if not updated
*                          5. Update the menu data, with the new object
* */
const menuItemUpdate    = async data => {
	console.log( ' Menu '.bgBlue.black.bold, ' PUT '.bgCyan.grey.bold );
	const headers           = data.headers;
	const payload           = data.payload;
	const queryStringObject = data.queryStringObject;
	
	const email     = ( validateString( headers.email) && validateEmail( headers.email ) ) ? headers.email : false;
	const token     = validateString( headers.token ) ? headers.token : false;
	const price     = ( typeof payload.price === 'number' && payload.price > 0 ) ? payload.price : false;
	const itemName  = validateString( queryStringObject.name ) ? queryStringObject.name : false;
	
	if ( !payload.name && ( itemName && price && token ) ) {
		const validTokenMsg = await validateToken( token, email );
		if ( validateStatusCodeOk( validTokenMsg ) ) {
			const itemDataMsg = await  menuService._read( itemName );
			if ( validateStatusCodeOk( itemDataMsg ) ) {
				const itemData  = parseJsonToObject( itemDataMsg.data );
				const itemDataObj = {
					id      : itemData.id,
					name    : itemName,
					price   : price || itemData.price,
				};
				const menuUpdateMsg = await menuService._update( itemName, itemDataObj );
				if ( validateStatusCodeOk( menuUpdateMsg ) ) {
					return responseTemplate( 200, `Item of menu updated successfully`, itemDataObj );
				} else {
					return errorTemplate( 'ENODATA', 'Item was not updated [ menu.menuItemUpdate ]');
				}
			} else {
				return errorTemplate( 'ENODATA', 'Item was not found [ menu.menuItemUpdate ]' );
			}
		} else {
			validTokenMsg.message   += ' Invalid token [ menu.menuItemUpdate ]';
			return validTokenMsg; //errorTemplate( 'EACCESS', 'A valid token or email is required' );
		}
	} else if ( payload.name ) {
		return errorTemplate( 'ENODATA', 'Name cannot updated [ menu.menuItemUpdate ]' );
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields ( name, price ) [ menu.menuItemUpdate ]' );
	}
};

/*
* Item - DELETE
* Required data: headers → email, token
*                queryStringObject → name
* Optional data: None
* Procedure description:   1. Validates email, name, and token
*                          2. Validates token
*                          3. Delete menu
* */
const menuItemDelete  = async data => {
	console.log( ' Menu '.bgBlue.black.bold, ' DELETE '.bgCyan.grey.bold );
	const queryStringObject = data.queryStringObject;
	const headers           = data.headers;
	
	const email = ( validateString( headers.email) && validateEmail( headers.email ) ) ? headers.email : false;
	const token = validateString( headers.token ) ? headers.token : false;
	const name  = validateString( queryStringObject.name ) ? queryStringObject.name : false;
	
	if ( name && email && token ) {
		const valTokenAns   = await validateToken( token, email );
		if ( validateStatusCodeOk( valTokenAns ) ) {
			const deleteItemMsg = await menuService._delete( name);
			if ( validateStatusCodeOk(deleteItemMsg ) ) {
				return responseTemplate( 200, `Item deleted successfully`, {} );
			}
			else {
				return errorTemplate( 'ENOENT', `Item could not be deleted or it does not exist [ menu.menuItemDelete ]` );
			}
			
		} else {
			valTokenAns.message += ' Invalid token [ menu.menuItemDelete ] ';
			return valTokenAns; //errorTemplate( 'EACCESS', 'Unauthorized access' );
		}
	} else {
		return errorTemplate( 'EINVAL', 'Missing or invalid required fields ( item name ) [ menu.menuItemDelete ]' );
	}
};

module.exports  = {
	post    : menuItemPost,
	get     : menuGet,
	put     : menuItemUpdate,
	delete  : menuItemDelete,
};
