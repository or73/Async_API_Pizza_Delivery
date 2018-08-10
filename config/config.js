/*
* Create and export configuration variables
* */

// General container for all the environments
const config    = {};

// Staging (default) environment
if ( process.env.NODE_ENV === 'production' ) {
	config.httpPort     = process.env.port || 5000;
	config.httpsPort    = config.httpPort + 1;
	config.mode         = process.env.NODE_ENV;
} else {
	config.httpPort     = process.env.port || 3000;
	config.httpsPort    = config.httpPort + 1;
	config.mode         = 'staging';
}


config.hashSecret   = 'thisIsASecret';

config.stripe       = {
	secret  :  'This key can not be shared, use your own key',
	apiVersion  : '2018-07-27',
};


config.mailgun      = {
	apiKey  : 'This key can not be shared, use your own key',
	domain  : 'This data can not be shared, use your own domain'
};

// Export the module
module.exports = config;
