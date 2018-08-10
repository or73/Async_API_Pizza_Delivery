/*
* Library for CRUD operations over files
* */

// Dependencies
const fs        = require( 'fs' );
const fs_extra  = require( 'fs-extra' );
const path      = require( 'path' );

const { promisify }    = require( 'util');

const {
	errorTemplate,
	parseJsonToObject,
	parseObjectToJson,
	responseTemplate,
	validateFileExist,
	validateStatusCodeOk,
	validateString,
	validateValueInArray,
}           = require( '../lib/helpers' );

const _openFileAsync = promisify( fs.open );
const _closeFileAsync= promisify( fs.close );
const _readFileAsync = promisify( fs.readFile );
const _writeFileAsync= promisify( fs.writeFile );
const _delFileAsync  = promisify( fs.unlink );
const _truncFileAsync= promisify( fs.truncate );
const _makeDirAsync  = promisify( fs.mkdir );
const _readDirAsync  = promisify( fs.readdir );

const _validEntities= [ 'menus', 'oarc', 'purchaseOrders', 'shoppingCarts', 'users', 'tokens' ];

/*
* _createDir
* Validates if 'entityName' directory exists, if not it is created
* */
const _createDir    = async ( _baseDir, entityName ) => {
	const path  = `${ _baseDir }/${ entityName }`;
	
	if ( validateFileExist( path ) ) {
		console.log( `[ data._createDir ] The ${ entityName } folder already exists` );
		return responseTemplate( 200, `${ entityName } folder already exists` );
	} else {
		console.log(`[ data._createDir ] The ${ entityName } folder does not exists`);
		_makeDirAsync(`${ path } `)
			.then(() => {
				console.log(`[ data._createDir ] The ${ entityName } folder has been created`);
				return responseTemplate(201, `${ entityName } folder has been created`);
			})
			.catch(error => {
				console.log(`Error [ data._createDir ]: ${ entityName } folder could not be created - Wrong Path - errorCode: ${ error.code || 'Bad Request' } -  statusCode: ${ error.statusCode || 400 }`);
				return errorTemplate(error.code || 'Bad Request', `[ data._createDir ]: ${ entityName } folder could not be created - Wrong Path`, error.statusCode || 400);
			});
	}
};

/*
* Services wrapper.  Contains all valid operations(CRUD) to work with files
* */
const _dataService   = ( entityName ) => {
	// Validate if entityName is a valid string and a valid entity
	// Validate if entity is a valid string
	if ( !validateString( entityName) )  return errorTemplate( 'EINVAL', `Provided value is not a valid string: ${ entityName }` );
	// Validate if entity is valid
	if ( !validateValueInArray( entityName, _validEntities) ) return errorTemplate( 'EEXIST', `${ entityName } is a not valid entity` );
	
	const _baseDir      = path.join( __dirname, '../.data' );
	// Create the path to provided entity
	_createDir( `${ _baseDir }`, `${ entityName}` )
		.then( answer => {
			console.log( `[ data._baseDir] - ${ answer.message }` );
		} )
		.catch( error => {
			console.log( 'ERROR: ', error );
			console.log( `Error [ data._createDir ]: ${ entityName } folder could not be created - errorCode: ${ error.code || 'Bad Request' } -  statusCode: ${ error.statusCode || 400 }` );
			return errorTemplate( error.code || 'Bad Request', `[ data._createDir ]: ${ entityName } folder could not be created`, error.statusCode || 400 );
		} );
		
	/*
	* _create
	* Description: creates a new file, with a file name,  before validates if the file exists, and if fileName and .data are valid
	* Required Data: dirName (name of directory where file will be created), fileName (name of the file - must be a string with length > 0) and .data (its content)
	* Optional Data: None
	* */
	let _create = async ( fileName, data ) => {
		// Validates if fileName is a valid string
		if ( !validateString( fileName ) ) return errorTemplate( 'EINVAL' `[ data._delete ] ${ fileName } is not a valid string value` );
		
		// Creates the filePath
		const filePath  = `${ _baseDir }/${ entityName }/${ fileName }.json`;
		
		// Validates if the file already exists
		if ( validateFileExist( filePath ) ) {
			console.log( `[ data._create._writeFileAsync ] - ${ fileName } already exist` );
			return errorTemplate( 'EEXIST', `${ fileName } file already exists` );
		} else {
			try {
				// Open the new file with write permissions
				console.log( `[ data._create._writeFileAsync ] - ${ fileName } has been opened in writing mode` );
				// Write string JSON data in file
				await _writeFileAsync(`${filePath}`, `${ parseObjectToJson(data) }`, 'utf8');
				// If data is stored then close the File Descriptor
				console.log( `[ data._create._writeFileAsync ] - ${ fileName } does not exist and will be created` );
				console.log( `[ data._create._writeFileAsync ] - ${ fileName } has been be created`);
				return responseTemplate( 201, `${ fileName } file has been created successfully`, data );
			} catch ( error ) {  // File could not opened, then an ERROR occurred
				console.log( 'ERROR: ', error );
				console.log( `Error [ data._create ]: ${ fileName } file could not be found - errorCode: ${ error.code || 'ENOENT' } -  statusCode: ${ error.statusCode || 404 }` );
				return errorTemplate( error.code || 'ENOENT', `[ data._create ]: ${ fileName } file could not be created`, error.statusCode || 404 );
			}
		}
	};
	
	/*
	* _read
	* Description: read a file, by its file name,  before validates if the file exists, and if fileName is valid
	* Required Data: dirName, fileName (name of the file - must be a string with length > 0)
	* Optional Data: None
	* */
	let _read  = async ( fileName ) => {
		console.log( `[ data._read ] - This the fileName received: ${ fileName }` );
		// Validate if fileName is a valid string
		if ( !validateString( fileName ) ) return errorTemplate('EINVAL'`[ data._delete ] ${ fileName } is not a valid string value`);
		// Creates file path
		const filePath = `${ _baseDir }/${ entityName }/${ fileName }.json`;
		console.log( `[ data._read ] - This the filePath received: ${ filePath }` );
		let fileData    = null;
		// Validates if filePath exists
		if ( validateFileExist( filePath ) ) {
			try {
				const fileDescriptor = await _openFileAsync(filePath, 'r');
				fileData = await _readFileAsync(fileDescriptor, 'utf8');
				await _closeFileAsync(fileDescriptor);
				console.log(`[ data._read ] - fileData: `, fileData);
				return responseTemplate(200, 'File fetched successfully', fileData);
			} catch ( error ) {  // File could not opened, then an ERROR occurred
				console.log( 'ERROR: ', error );
				console.log( `Error [ data._read ]: ${ fileName } file could not be fetched - errorCode: ${ error.code || 'ENOENT' } -  statusCode: ${ error.statusCode || 404 }` );
				return errorTemplate( error.code || 'ENOENT', `[ data._read ]: ${ fileName } file could not be fetched`, error.statusCode || 404 );
			}
		} else {
			console.log( `[ data._read ] - ${ fileName } does not exist` );
			return errorTemplate('ENOENT', `[ data._read ] ${ fileName } file does not exists`);
		}
	};
	
	/*
	* _udpate
	* Description: update a file, by its file name, before validates if the file exists, and if fileName and .data are valid
	* Required Data: fileName (name of the file - must be a string with length > 0) and .data (a not empty object)
	* Optional Data: None
	* */
	let _update    = async ( fileName, newData ) => {
		// Validate if dirName and fileName are valid strings, and if newData is a JSON object
		const fileN = validateString( fileName ) ? fileName : false;
		const newD  = validateString( newData ) ? parseJsonToObject( newData ) : newData;
		
		// Validate if fileN is true
		if ( !fileN ) return errorTemplate( 'EINVAL' `[ data._delete ] ${ fileName } is not a valid string value` );
		
		// Validate fileName exists
		const filePath = `${ _baseDir }/${ entityName }/${ fileN }.json`;
		// Validate if filePath exists
		if ( validateFileExist( filePath ) ) {			
			const fileDescriptor= await _openFileAsync( filePath, 'r+' );
			await _truncFileAsync( fileDescriptor );
			await _writeFileAsync( fileDescriptor, `${ parseObjectToJson( newD ) }`, 'utf8');			
			await _closeFileAsync( fileDescriptor );		
			return responseTemplate( 201, `${ fileN } has been updated successfully`, newD );
		} else {
			console.log( `[ data._update ] - ${ fileName } does not exist` );
			return errorTemplate('ENOENT', `[ data._update ] ${ fileName } file does not exists`);
		}
	};
	
	/*
	* _delete
	* Description: delete a file, by its file name, before validates if the files exits, and if fileName is valid
	* Required Data: fileName (name of the file - must be a string with a length > 0)
	* Optional Data: None
	* */
	let _delete    = async ( fileName ) => {
		// Validate if dirName and fileName are valid strings
		const fileN = validateString( fileName ) ? fileName : false;
		const filePath  = `${ _baseDir }/${ entityName }/${ fileN }.json`;
		
		// Validate if fileN is valid
		if ( !fileN ) return errorTemplate( 'EINVAL' `[ data._delete ] ${ fileName } is not a valid string value` );
		// Validate if filePath exists
		if ( validateFileExist( filePath ) ) {
			try {
				const delVal    = await _delFileAsync( filePath );
				console.log( `[ data._delete ] - delVal: `, delVal );
				return responseTemplate( 201, `${ fileN } has been deleted successfully`, {} );
			} catch ( error ) {  // File could not opened, then an ERROR occurred
				console.log( 'ERROR: ', error );
				console.log( `Error [ data._delete ]: ${ fileName } file could not be deleted - errorCode: ${ error.code || 'ENOENT' } -  statusCode: ${ error.statusCode || 404 }` );
				return errorTemplate( error.code || 'ENOENT', `[ data._delete ]: ${ fileName } file could not be deleted`, error.statusCode || 404 );
			}
		} else {
			console.log( `[ data._delete ] - ${ fileName } does not exist` );
			return errorTemplate('ENOENT', `[ data._delete ] ${ fileName } file does not exists`);
		}
	};
	
	/*
	* _contentOfAllFiles
	* Description: Return an array of objects which contains objects of files with its content
	* Required Data: dirName (name of desired directory)
	* Optional Data: None
	* */
	let _contentOfAllFiles = async () => {
		// Validate if dirName and fileName are valid strings
		const dirPath  = `${ _baseDir }/${ entityName }`;
		
		try {
			if ( validateFileExist( dirPath ) ) {
				console.log(`[ data._namesOfAllFiles ] - ${ entityName } Directory/folder exists`);
				const filesList = await fs.readdirSync(dirPath);
				const namesList = filesList.map(fileName => fileName);
				let filesObjectsArray = [];
				
				for (let counter = 0; counter < namesList.length; counter++) {
					let fileName = namesList[counter];
					let fileNamePath = `${ _baseDir }/${ entityName }/${ fileName }`;
					let fileDescriptor  = await _openFileAsync( `${ fileNamePath }`, 'r' );
					let itemToAdd   = await _readFileAsync( fileDescriptor, 'utf8' );
					_closeFileAsync( fileDescriptor );
					if ( validateString( itemToAdd ) )	{
						delete itemToAdd.password;
						delete itemToAdd.shoppingCartId;
						delete itemToAdd.ordersBckp;
						filesObjectsArray.push(itemToAdd);
					}
				}
				console.log('[ data._contentOfAllFiles ] - List fetched successfully: ', filesObjectsArray);
				return responseTemplate(200, 'List fetched successfully', filesObjectsArray);
			} else {
				console.log( `[ data._read ] - ${ dirPath } folder does not exist` );
				return errorTemplate('ENOENT', `${ dirPath } folder does not exists`);
			}
		} catch( error ) {
			console.log( `Error [ data._namesOfAllFiles ]: ${ entityName } folder path does not exist - errorCode: ${ error.code || 'ENOENT' } -  statusCode: ${ error.statusCode || 404 }` );
			return errorTemplate( error.code || 'ENOENT', `[ data._namesOfAllFiles ] - ${ entityName } folder path does not exist`, error.statusCode || 404 );
		}
	};
	
	/*
	*  _itemList
	*  Description: Validates if a shopping Cart exist and returns its item list content
	*  Required data: dirName (name of desired directory), fileName(name of desired file)
	*  Optional data: none
	* */
	let _itemList = ( fileName ) => {
		const fileN = validateString( fileName ) ? fileName : false;
		
		const shoppingCardMsg   = _read( fileN );
		if ( validateStatusCodeOk( shoppingCardMsg ) ) {
			const shoppingCartData  = shoppingCardMsg.data;
			const shoppingCartObj   = parseJsonToObject( shoppingCartData );
			
			const itemsListObj  = {
				items   : parseObjectToJson( shoppingCartObj.items ),
				total   : parseJsonToObject( shoppingCartObj.total ),
			};
			return responseTemplate( 200, 'Item list fetched successfully',  itemsListObj );
		} else {
			shoppingCardMsg.message += ' [ data._itemList ]';
			return shoppingCardMsg;
		}
	};
	
	/*
	* _namesOfAllFiles
	* Description: Return a list of all files names into a directory
	* Required Data: dirName (name of desired directory)
	* Optional Data: None
	* */
	let _namesOfAllFiles = async () => {
		// Validate if dirName and fileName are valid strings
		const dirPath  = `${ _baseDir }/${ entityName }`;
		
		try {
			console.log( 'validateFileExist: ', validateFileExist( `${ dirPath }` ) );
			if ( validateFileExist( `${ dirPath }` ) ) {
				console.log( `[ data._namesOfAllFiles ] - ${ entityName } Directory/folder exists` );
				const filesList = await fs.readdirSync(dirPath);
				const namesList = filesList.map( fileName => fileName.substring( 0, fileName.lastIndexOf( '.' ) ) );
				console.log( '[ data._namesOfAllFiles ] - List fetched successfully ' );
				return responseTemplate( 200, 'List fetched successfully', namesList );
				//fileName.trim().replace( /(\..*)$/, '' ) );
				
			} else {
				console.log( `[ data._namesOfAllFiles ] - ${ entityName } folder does not exist` );
				return errorTemplate( 'ENOENT', `[ data._namesOfAllFiles ] - ${ entityName } folder does not exist` );
			}
		} catch( error ) {
			console.log( `Error [ data._namesOfAllFiles ]: ${ entityName } folder path could not be found - errorCode: ${ error.code || 'ENOENT' } -  statusCode: ${ error.statusCode || 404 }` );
			return errorTemplate( error.code || 'ENOENT', `[ data._namesOfAllFiles ] - ${ entityName } folder path could not be found`, error.statusCode || 404 );
		}
	};
	
	return { _create, _read, _update, _delete, _contentOfAllFiles, _itemList, _namesOfAllFiles };
};

module.exports  = _dataService;
