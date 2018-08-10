/*
* Library for validation of paths and methods
* */

// Dependencies
const menuCtrl          = require( '../controllers/menu' );
const orderCtrl         = require( '../controllers/purchaseOrders' );
const shoppingCartCtrl  = require( '../controllers/shoppingCart' );
const userCtrl          = require( '../controllers/users' );
const tokenCtrl         = require( '../controllers/tokens' );


/*
 * Valid requests
 **/
const validRequests = [
	{
		path    : 'menus',
		methods : [ 'get', 'post', 'put', 'delete' ]
	}, {
		path    : 'purchaseOrders',
		methods : [ 'get', 'post' ]
	}, {
		path    : 'shoppingCarts',
		methods : [ 'get', 'post', 'put', 'delete' ]
	}, {
		path    : 'tokens',
		methods : [ 'get', 'post', 'put', 'delete' ]
	}, {
		path    : 'users',
		methods : [ 'get', 'post', 'put', 'delete' ]
	},
];


/*
* Controllers
* */
const ctrls = {
	'menus'             : menuCtrl,
	'purchaseOrders'    : orderCtrl,
	'shoppingCarts'     : shoppingCartCtrl,
	'tokens'            : tokenCtrl,
	'users'             : userCtrl,
};


const router    = {
	// Validate path and method required
	isValidRequest: ( path, method ) => validRequests.map( req => req.path ) && validRequests.find( req => req.path === path ).methods.includes( method ),
	isValidPath: path => validRequests.map( req => req.path ).includes( path ),
	...ctrls
};


module.exports  = router;
