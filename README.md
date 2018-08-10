API for a Pizza-Delivery Company
=
---
# Requirements  
This API requires a couple of keys that must be provided before running the application.  These keys must be added in the **[config.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/config/config.js)** file, and are keys for **`stripe`** and **`mailgun`**. Required fields are marked with a **'*`This key cannot be shared, user your own key`*'** message.

## Table of Contents

1. [Server Ports](#server-ports)

2. [Folders Structure](#folders-structure)  

3. [Controllers and Objects: Structure and Relationships](#controllers-and-objects-structure-and-relationships)

4. **[Menu's Methods](#menus-methods)** ⇒ | [<code>POST</code>](#menu-post) | [<code>GET</code>](#menu-get) | [<code>PUT</code>](#menu-put) | [<code>DELETE</code>](#menu-delete) |

5. **[Order's Methods](#orders-methods)** ⇒ | [<code>POST</code>](#order-post) | [<code>GET</code>](#order-get) |

6. **[ShoppingCart's Methods](#shoppingcart-methods)** ⇒ | [<code>POST</code>](#shoppingcart-post) | [<code>GET</code>](#shoppingcart-get) | [<code>PUT</code>](#shoppingcart-put) | [<code>DELETE</code>](#shoppingcart-delete) |

7. **[Token's Methods](#tokens-methods)** ⇒ | [<code>POST</code>](#token-post)   [<code>GET</code>](#token-get) | [<code>PUT</code>](#token-put) | [<code>DELETE</code>](#token-delete) |

8. **[User's Methods](#users-methods)** ⇒ | [<code>POST</code>](#user-post) | [<code>GET</code>](#user-get) | [<code>PUT</code>](#user-put) | [<code>DELETE</code>](#user-delete) |

9. **[Credits](#credits)** 

---

# Server-Ports  

| Protocol   | Port          | Port             |
| ---        | ---           | ---              |
| http       | 3000          | 5000             |
| https      | 3001          | 5001             |
| **`mode`** | **`Staging`** | **`Production`** |
---

# Folders-Structure  
    (https://github.com/or73/Async_API_Pizza_Delivery/blob/master/config/config.js)
* [config](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/config)    
    * [config.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/config/config.js)   
* [controllers](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/controllers)
    * [menu.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/controllers/menu.js)
    * [order.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/controllers/purchaseOrders.js)
    * [shoppingCart.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/controllers/shoppingCart.js)
    * [tokens.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/controllers/tokens.js)
    * [users.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/controllers/users.js)
* [lib](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/lib)
    * [authentication.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/lib/authentication.js)
    * [helpers.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/lib/helpers.js)
    * [router.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/lib/router.js)
* [app.js](https://github.com/or73/Async_API_Pizza_Delivery/blob/master/app.js)

---   
# Controllers-and-Objects-Structure-and-Relationships
![Structure and Relations](https://github.com/or73/pizzaApi/blob/master/apiPizzaDeliveryDBStructure_md.png)

---


# Menus-Methods 
## menu-POST
**(Request that the resource at the URI do something with the provided entity)**   
### General Information
    Required data: payload → name and price
    Optional data: None
    Procedure description:   1. Validate name and price
                             2. Validate menu exists
                             3. Generate item id, randomly
                             4. Create item object
                             5. Add item object to menu1. Validate token exists

### Path and Required Data      
      
| Path   | Parameters             | Headers | e.g.                       |
| ---    | ---                    | ---     | ---                        |
| /menus | name **`(required)`**  | None    | http://localhos:3000/menus |
|        | price **`(required)`** |         |                            |
   
   
### menu-post-Response   
Stores information of required token   

```javascript
{
    statusCode: 200,
    message: 'Item created successfully',
    data: {
       id,
       price,
       name
    }
}
```

### menu-post-Errors    
   
| Error | Parameters                                            |
| ---   | ---                                                   |
| 404   | No data available. Item was not created               |
| 412   | Invalid argument.  Missing or invalid required fields |
| 451   | File or directory already exists                      |

---  
      
## menu-GET
**(Retrieve information)**
### General Information
    Required data: queryStringObject → name and price
    Optional data: None
    Procedure description:   1. Validates operation, one item of menu or a list of items in menu
                             2. Validate item exists
                             3. Retrieve item information or items list

> If the item exists, then returns all information associated with item, except the id.  Otherwise, returns an error message.
> If path includes 'all' then a list of all fetched menus   

### Path and Required Data      


| Path             | Parameters            | Headers | e.g.                                      |
| ---              | ---                   | ---     | ---                                       |
| /menus?id=string | name **`(required)`** | None    | http://localhost:3000/menus?name=itemName |
| /menus?all       | None                  | None    | http://localhost:3000/menus?all           |
   
   
### menu-get-Response   
**For path: /items?id=itemId**   (Retrieves information of a specific item)   

```javascript
{
    statusCode: 200,
    message: 'Item fetched successfully',
    data: {
       id,
       price,
       name
    }
}
```   

**For path /items?all**   (Retrieves a list of all items that exist, but the query must contains a valid token or it returns an error message)   

```javascript
{
   statusCode: 200,
   message: 'List of menu items fetched successfully'
   data: {
          items: [
                 {
                    id,
                    price,
                    name
                  }, {
                    id,
                    price,
                    name
                  }
          ]
   }
}
```

### menu-get-Errors    
      
| Error | Parameters                                            |
| ---   | ---                                                   |
| 404   | No such file or directory.  Menu item does not exist  |
| 404   | No data available.  Menu items list was not fetched   |
| 412   | Invalid argument.  Missing or invalid required fields |

---   

## menu-PUT
**(Store an entity at a URI)**   
### General Information
    Required data: queryStringObject → name and price
    Optional data: None
    Procedure description:   1. Validates itemName, price, and token
                             2. Validates token
                             3. Validates menu exists
                             4. Generate new menu object, with all new values, and previous values, if not updated
                             5. Update the menu data, with the new object

> Updates 'name' and 'price' fields of an item.  A valid id must be send or an error message will be return.

### Path and Required Data 


| Path             | Parameters             |  Headers                 | e.g.                                  |
| ---              | ---                    | ---                      | ---                                   |
| /menus?id=string | name **`(required)`**  | email **`(required)`**   | http://localhost:3000/menus?id=orange |
|                  | price **`(required)`** | tokenId **`(required)`** |                                       |

### menu-put-Response
```javascript
{
   statusCode: 200,
   message: 'Item of menu updated successfully',
   data: {
      id,
      price,
      name
   }
}
```   

### menu-put-Errors    
      
| Error | Parameters                                                                         |
| ---   | ---                                                                                |
| 403   | Permission denied... insufficient permissions.  A valid token or email is required |
| 403   | Permission denied... Insufficient permissions                                      |
| 404   | No data available.  Token not found                                                |
| 404   | No data available.  Item was not found                                             |
| 404   | No data available.  Item was not updated                                           |
| 412   | Invalid argument.  Missing or invalid required fields.                             |
| 428   | Timer expired.   Token expired                                                     |

---   

## menu-DELETE
**(Request that a resource be removed)**   
### General Information
    Required data: headers → email, token
                   queryStringObject → name
    Optional data: None
    Procedure description:   1. Validate email, and token
                             2. Validates token
                             3. Delete menu
> Remove the item provided, and update all menus and user's cartItems which contains provided item and remove it.

### Path and Required Data 

| Path             | Parameters |  Headers               | e.g.                                  |
| ---              | ---        | ---                    | ---                                   |
| /menus?id=string | None       | token **`(required)`** | http://localhost:3000/menus?id=itemId |
|                  |            | email **`(required)`** |                                       |

### menu-delete-Response
```javascript
{
   statusCode: 200,
   message: 'Item deleted successfully',
   data: { }
}
```   

### menu-delete-Errors    
      
| Error | Parameters                                                           |
| ---   | ---                                                                  |
| 403   | Permission denied... insufficiente permissions.  Unauthorized access |
| 404   | No such file or directory.  Item could not be deleted                |
| 404   | No data available.  Token not found                                  |
| 412   | Invalid argument.  Missing or invalid required fields                |
| 428   | Timer expired.   Token expired                                       |

---  

# Orders-Methods 
## order-POST
**(Request that the resource at the URI do something with the provided entity)**   
### General Information
    Required data: headers → token
                   queryStringObject → email
    Optional data: None
    Procedure description:  1. Validate tokenId and email are valid strings
                            2. Validate user exists
                            3. Validate token is valid
                            4. Validates if shoppingCard has an item list
                            5. Validate payment with 'Stripe'
                            6. Create order object
                            7. Send email with order's details
                            8. Stores order object


### Path and Required Data 
Will create an order with the items on cart    
      
| Path                                  | Parameters | Headers                    | e.g.                        |
| ---                                   | ---        | ---                        | ---                         |
| /purchaseOrders?email=valid@email.com | None       | tokenId **`(required)`** | http://localhos:3000/purchaseOrders?email=somevalid@email.com |
   
   
### order-post-Response   

```javascript
{
    statusCode: 201,
    message: 'Order created successfully',
    data: {
       id,
       shoppingCartId,
       items,
       total,
       paymentMethod,
       currency,
       authorization,
       authorizationDate,
       country,
       object,
       last4
    }
}
```

### order-post-Errors    
   
| Error | Parameters                                                                |
| ---   | ---                                                                       |
| 403   | Permission denied... insufficiend permissions                             |
| 404   | No data available. Order id could not be generated                        |
| 404   | No data available. FileName does not exist                                |
| 412   | Invalid argument. MMissing or invalid required fields                     |
| 412   | Invalid argument. An invalid string value was sent as dirName or fileName |
| 412   | Invalid argument. Provided values are invalid (directory/file)            |
| 428   | Timer expired. Token expired                                              |   
| 451   | File or directory already exists.  Filename already exists, use update to modify values |

---  
      
## order-GET
**(Retrieve information)**
### General Information
    Required data: headers → token
                   queryStringObject → email
    Optional data: None
    Procedure description:  1. Validate tokenId and email are valid strings
                            2. Validate user exists
                            3. Validate token is valid
                            4. Read and Validate Purchase Order
> If the cart exists, then returns all information associated with cart.  Otherwise, returns an error message.

### Path and Required Data 


| Path                                  | Parameters             | Headers                  | e.g.                                    |
| ---                                   | ---                    | ---                      | ---                                     |
| /purchaseOrders?email=valid@email.com | email **`(required)`** | tokenId **`(required)`** | http://localhost:3000/purchaseOrders/email=somevalid@email.com |
   
   
### order-get-Response   

```javascript
{
    statusCode: 200,
    message: 'Order fetched successfully',
    data: {
       id,
       shoppingCartId,
       items,
       total,
       paymentMethod,
       currency,
       authorization,
       authorizationDate,
       country,
       object,
       last4
    }
}
```   

### order-get-Errors    
      
| Error | Parameters                                                    |
| ---   | ---                                                           |
| 403   | Permission denied... indufficient permissions                 |
| 404   | No data availalbe. Filename does not exist                    |
| 412   | Ivalid argument. Missing or invalid required fields           |
| 412   | Ivalid argument. Missing or invalid required fields.  Required fields missing or they were invalid |
| 412   | Ivalid argument. Provided values are invalid (directory/file) |
| 428   | Timer expired. Token expired                                  |

---   

# ShoppingCart-Methods 
## shoppingCart-POST
**(Request that the resource at the URI do something with the provided entity)**   
### General Information
    Required data: payload → email, token
                   queryStringObject → item, qtty
    Optional data: None
    Procedure description: 1. Validate email, token, item, qtty
                           2. Validate token
                                 If item && qtty                         If !item && !qtty
                           3. Validate if item exists in menu        3. Validate Shopping Cart  exists
                           4. Create new item object                 4. Create new Shopping Cart object
                           5. Add new item object to Shopping Cart   5. Create new Shopping Cart

### Path and Required Data      
      
| Path                                                 | Parameters            | Headers                | e.g.                               |
| ---                                                  | ---                   | ---                    | ---                                |
| /shoppingCarts                                       | None                  | email **`(required)`** | http://localhos:3000/shoppingCarts |
|                                                      |                       | token **`(required)`** |                                    |
| /shoppingCarts?item=<item Name>&qtty=<integer value> | item **`(required)`** | email **`(required)`** | http://localhost:3000/shoppingCarts?item=tomatoe&qtty=10 |
|                                                      | qtty **`(required)`** | token **`(required)`** |                                    |
   
   
### shoppingCart-post-Response   
Stores information of required token   
   
**For path: /shoppingCarts**
```javascript
{
    statusCode: 200,
    message: 'Shopping Cart created successfully',
    data: {
       id,
       price,
       name
    }
}
```

**For path: /shoppingCarts?item=<item Name>&qtty=<integer value>**
```javascript
{
    statusCode: 200,
    message: 'Product added to Shopping Cart, successfully',
    data: {
       id,
       price,
       name
    }
}
```

### shoppingCart-post-Errors    
   
| Error | Parameters                                                                        |
| ---   | ---                                                                               |
| 403   | Permission denied... insufficient permissions                                     |
| 404   | No data available.  Token not found                                               |
| 404   | Required file does not exist                                                      |
| 404   | Shopping cart was not created                                                      |
| 412   | Invalid argument.  Missing or invalid required fields                             |
| 428   | Timer expired.  Token expired                                                     |
| 451   | File or directory already exist                                                   |
| 451   | File or directory already exist.  Item already exist in carg... use update option |

---  
      
## shoppingCart-GET
**(Retrieve information)**
### General Information
    Required data: payload → email, token
                   queryStringObject → all
    Optional data: None
    Procedure description: 1. Validate email, token, item, qtty
                           2. Validate token
                                 If all                                    If !all
                           3. Validate if Shopping Cart exists       3. Validate Shopping Cart  exists
                           4. Fetch list of Shopping Carts           4. Fetch Shopping Cart

> If the item exists, then returns all information associated with item, except the id.  Otherwise, returns an error message.

### Path and Required Data  


| Path                     | Parameters            | Headers | e.g.                                              |
| ---                      | ---                   | ---     | ---                                               |
| /shoppingCarts?id=string | name **`(required)`** | None    | http://localhost:3000/shoppingCarts?name=itemName |
| /shoppingCarts?all       | None                  | None    | http://localhost:3000/shoppingCarts?all           |
   
   
### shoppingCart-get-Response   
**For path: /shoppingCarts?id=itemId**   (Retrieves information of a specific item)   

```javascript
{
    statusCode: 200,
    message: 'Shopping Cart Item fetched successfully',
    data: {
       id,
       price,
       name
    }
}
```   

**For path /shoppingCarts?all**   (Retrieves a list of all items that exist, but the query must contains a valid token or it returns an error message)   

```javascript
{
   statusCode: 200,
   message: 'Shopping Cart list fetched successfully'
   data: {
          items: [
                 {
                    id,
                    price,
                    name
                  }, {
                    id,
                    price,
                    name
                  }, ...
          ]
   }
}
```

### shoppingCart-get-Errors    
      
| Error | Parameters                                            |
| ---   | ---                                                   |
| 403   | Permission denied.... insufficient permissions        |
| 404   | No such file or directory.  Menu item does not exist  |
| 404   | No data available.  Menu items list was not fetched   |
| 412   | Invalid argument.  Missing or invalid required fields |
| 428   | Timer expired.  Token expired                         |

---   

## shoppingCart-PUT
**(Store an entity at a URI)**
### General Information
    Required data: headers → email, token
                   payload → items
                   queryStringObject → id
    Optional data: None
    Procedure description:   1. Validate email, token, shoppingCartId, items
                             2. Validate token
                             3. Validate if ShoppingCartId exists
                             4. Update each item in Shopping Cart

> Updates 'name' and 'price' fields of an item.  A valid id must be send or an error message will be return.

### Path and Required Data  

| Path                     | Parameters                 |  Headers                 | e.g.                                          |
| ---                      | ---                        | ---                      | ---                                           |
| /shoppingCarts?id=string | Array containing objects:  | email **`(required)`**   | http://localhost:3000/shoppingCarts?id=orange |
|                          |  [ {                       | tokenId **`(required)`** |                                               |
|                          |      name **`(required)`** |                          |                                               |
|                          |      qtty **`(required)`** |                          |                                               |
|                          |    }, ..., {               |                          |                                               |
|                          |      name **`(required)`** |                          |                                               |
|                          |      qtty **`(required)`** |                          |                                               |
|                          |  } ]                       |                          |                                               |

### shoppingCart-put-Response
```javascript
{
   statusCode: 201,
   message: 'Shopping Cart was updated successfully',
   data: {
      id,
      email,
      items: [ {
                 name,
                 price,
                 qtty,
                 total
               }, ..., {
                 name,
                 price,
                 qtty,
                 total
               }
             ]
   }
}
```   

### shoppingCart-put-Errors    
      
| Error | Parameters                                                                         |
| ---   | ---                                                                                |
| 403   | Permission denied... insufficient permissions.  A valid token or email is required |
| 403   | Permission denied... Insufficient permissions                                      |
| 404   | No data available.  Token not found                                                |
| 404   | No such file or directory.                                                         |
| 404   | No data available.  Item was not found                                             |
| 404   | No data available.  Item was not updated                                           |
| 412   | Invalid argument.  Missing or invalid required fields.                             |
| 428   | Timer expired.   Token expired                                                     |

---   

## shoppingCart-DELETE
**(Request that a resource be removed)**   
### General Information
    Required data: headers → email, token
                   payload → items
                   queryStringObject → id
    Optional data: None
    Procedure description:   1. Validate email, token, shoppingCartId, items
                             2. Validate token
                             3. Validate shoppingCartId exists
                                If shoppingCardId && !items   If shoppingCartId && items
                             4. Delete shoppingCart           4. Delete items qtty, from shopping Cart

> Remove the item provided, and update all menus and user's cartItems which contains provided item and remove it.

### Path and Required Data 

| Path                     | Parameters           |  Headers               | e.g.                                          |
| ---                      | ---                  | ---                    | ---                                           |
| /shoppingCarts?id=itemId | None                 | token **`(required)`** | http://localhost:3000/shoppingCarts?id=itemId |
|                          |                      | email **`(required)`** |                                               |
| /shoppingCarts?id=itemId | items [ item1, ... ] | token **`(required)`** | http://localhost:3000/shoppingCarts?id=itemId |
|                          |                      | email **`(required)`** |                                               |

### shoppingCart-delete-Response
**Delete a Shopping Cart: /shoppingCarts?id=itemId**
```javascript
{
   statusCode: 200,
   message: 'Shopping Cart deleted successfully',
   data: { }
}
```   
**Delete items from a Shopping Cart: For /shopingCarts?id=itemId**
```javascript
{
   statusCode: 200,
   message: 'Shopping Cart items deleted successfully',
   data: { 
      id,
      mail,
      items
   }
}
```   

### shoppingCart-delete-Errors    
      
| Error | Parameters                                                           |
| ---   | ---                                                                  |
| 403   | Permission denied... insufficiente permissions.  Unauthorized access |
| 404   | No such file or directory.  Item could not be deleted                |
| 404   | No data available.  Token not found                                  |
| 406   | No items found in Shopping Cart to delete                            |
| 412   | Invalid argument.  Missing or invalid required fields                |
| 428   | Timer expired.   Token expired                                       |

---

# Tokens-Methods  
## token-POST   
**(Request that the resource at the URI do something with the provided entity)**  
### General Information
    Required data: Payload → email, password
    Optional data: None
    Procedure description:   1. Validate user exists
                             2. Create token object
                             3. Stores token object 

### Path and Required Data     
| Path    | Parameters              | Headers | e.g.                         |
| ---     | ---                     | ---     | ---                          |
| /tokens | email **`required`**    | None    | http://localhost:3000/tokens |
|         | password **`required`** |         |                              |
   
   
### token-post-Response   
Stores information of required token   
   
```javascript
{
    statusCode: 200,
    message: 'User logged in',
    data: {
       id,
       email,
       expires
    }
}
```
   
### token-post-Errors    
   
| Error | Parameters                                               |
| ---   | ---                                                      |
| 400   | Token was not created                                    |
| 404   | No data available.  Token was not created                |
| 404   | No such file or directory.  Required file does not exist |
| 412   | Invalid argument.  Missing or invalid required fields    |
| 451   | File or directory already exists                         |

---  
      
## token-GET   
**(Retrieve information)**   
### General Information
    Required data: queryStringObject → token
    Optional data: None
    Procedure description:   1. Validate token exists
                             2. Retrieves token information or token list

    Two operations are available:
      1. Get information of one token
      2. Get a list of all existing tokens

### Path and Required Data 
If the token exists, then returns all information associated with token, except the id.  Otherwise, returns an error message.   
   
| Path              | Parameters               |  Headers | e.g.                                    |
| ---               | ---                      | ---      | ---                                     |
| /tokens?id=string | tokenId **`required`**   | None     | http://localhost:3000/tokens?id=tokenId |
| /tokens?all       | tokenId **`(required)`** | None     | http://localhost:3000/users?all         |
   
   
### token-get-Response    
**For path: /tokens?id=tokenId**   (Retrieves information of a specific token)   
   
```javascript
{
    statusCode: 200,
    message: 'Token fetched successfully',
    data: {
       id,
       email,
       expires
    }
}
```   
   
**For path /tokens?all**   (Retrieves a list of all tokens that exist, but the query must contains a valid token or it returns an error message)   
   
```javascript
{
   statusCode: 200,
   message: 'Tokens list fetched successfully'
   data: {
          items: [
                 {                         
                         email,
                         expires
                  }, {
                         email,
                         expires
                  }
          ]
   }
}
```   
   
### token-get-Errors    
      
| Error | Parameters                                               |
| ---   | ---                                                      |
| 404   | No data available. Token was not fetched                 |
| 404   | No such file or directory.  Required file does not exist |
| 404   | No data available. Token list was not fetched            |
| 412   | Invalid argument.  Missing or invalid required fields    |

---      
   
## token-PUT
**(Store an entity at a URI)**   
### General Information
    Required data: QueryStringObject → token
    Optional data: None
    Procedure description:   1. Validate token exists
                             2. Reset token timer
                             3. Update token data

### Path and Required Data 
Updates 'expires' field of a token, resets it and assigns it a new life time.  A valid token must be send or an error message will be return.   
   
| Path              | Parameters |  Headers | e.g.                                    |
| ---               | ---        | ---      | ---                                     |
| /tokens?id=string | expires    | None     | http://localhost:3000/tokens?id=tokenId |   
   
> Resets 'expires' field, and assigns it a new life time.   
   
### token-put-Response   

```javascript
{
   statusCode: 200,
   message: 'Token time has been reset successfully',
   data: {
      id,
      email,
      expires
   }
}
```     
   
### token-put-Errors    
      
| Error | Parameters                                                              |
| ---   | ---                                                                     |
| 403   | Permission denied... Insufficient permissions                           |
| 403   | Permission denied... Insufficient permissions. Token time was not reset |
| 404   | No data available.  Token was not found                                 |
| 404   | No such file or directory.  Required file does not exist                |
   
---      
   
## token-DELETE   
**(Request that a resource be removed)**   
### General Information
    Required data: QueryStringObject → token
    Optional data: None
    Procedure description:   1. Validate token exists
                             2. Delete token 

### Path and Required Data   
   
| Path              | Parameters |  Headers | e.g.                                    |
| ---               | ---        | ---      | ---                                     |
| /tokens?id=string | None       | None     | http://localhost:3000/tokens?id=tokenId |   
   
### token-delete-Response   
   
```javascript
{
   statusCode: 200,
   message: 'Token deleted successfully',
   data: { }
}
```      
   
### token-delete-Errors    
      
| Error | Parameters                                            |
| ---   | ---                                                   |
| 403   | Permission denied... Insufficient permissions         |
| 404   | No data available. Toke, was not found                |
| 404   | No such file or directory                             |
| 405   | Operation not permitted.  Tokes has not been deleted  |
| 412   | Invalid argument.  Missing or invalid required fields |
   
---   

# Users-Methods  

## user-POST   
**(Request that the resource at the URI do something with the provided entity)**      
### General Information
    Required data: Payload → email, address, password, name
    Optional data: None
    Procedure description:   1. Validates email, password, address, and name
                             2. Validates user exist
                             2. Creates User Object                             
                             3. Generates tokenId and token timer
                             4. Creates user and token object
    
    All data is required to create the user.
    Two more fields are filled automatically:
       shoppingCartId: false → is a boolean, is true if the user has a shoppingCart  
       ordersBckp: [ ]       → will contain all the purchase orders made by the user 

### Path and Required Data
| Path   | Parameters                | Headers | e.g.                        |
| ---    | ---                       | ---     | ---                         |
| /users | email **`(required)`**    | None    | http://localhost:3000/users |
|        | name **`(required)`**     |         |                             |
|        | password **`(required)`** |         |                             |
|        | address **`(required)`**  |         |                             |
  
### user-post-Response   

Stores information of required user   

```javascript
{
    statusCode: 200,
    message: 'User created successfully',
    data: {
       email,
       address,
       name
    }
}
```
   
### user-post-Errors    
   
| Error | Parameters                                               |
| ---   | ---                                                      |
| 400   | Token was not created                                    |
| 404   | No data available.  Token was not created                |
| 404   | No data available.  User was not created                 |
| 404   | No such file or directory.  Required file does not exist |
| 412   | Invalid argument.  Missing or invalid required fields    |
| 451   | File or directory already exists                         |
   
---     
      
## user-GET   
**(Retrieve information)**   
### General Information
    Required data: queryStringObject → email
                   headers → token
    Optional data: None
    Procedure description:  1. Token validation
                            2. Validate if user exists
                            3. Retrieves the information
    
    Two operations are available:
     1. Get information of one user   → retrieves information of provided mail's user
     2. Get a list of existing users  → retrieves a list of users
    
    Both operation requires a user and token validation.
> If the mail exists, then returns all information associated with user, except the password.  Otherwise, returns an error message.   

### Path and Required Data  
| Path                           | Parameters             |  Headers                 | e.g.                                                |
| ---                            | ---                    | ---                      | ---                                                 |
| /users?mail=some@validmail.com | email **`required`**   | tokenId **`(required)`** | http://localhost:3000/users?mail=some@validmail.com |
| /users?all                     |  None                  | tokenId **`(required)`** | http://localhost:3000/users?all                     |
|                                |                        | email **`(required)`**   |
   
   
### user-get-Response   
**For path: /users?email=some@validmail.com**   (Retrieves information of a specific user)    
   
```javascript
{
    statusCode: 200,
    message: 'User fetched correctly',
    data: {
       email,
       address,
       name,
    }
}
```   

**For path /users?all**   (Retrieves a list of all users that exist, but the query must contains a valid token and its email, or it returns an error message)      

```javascript
{
   statusCode: 200,
   message: 'Returning all available users data'
   data: {
          items: [
                 {
                         email,
                         address,
                         name,
                  }, {
                         email,
                         address,
                         name,
                  }
          ]
   }
}
```

### user-get-Errors    
      
| Error | Parameters                                                                              |
| ---   | ---                                                                                     |
| 403   | Permission denied... Insufficient permissions.  Some provided values were not validated |
| 403   | Permission denied... Insufficient permissions                                           |
| 404   | No data available.  User was not fetched                                                |
| 404   | No data available.  Token not found                                                     |
| 404   | No data available.  User list was not fetched                                           |
| 404   | No such file or directory.  Required file does not exist                                |
| 412   | Invalid argument.  Required fields missing or invalid                                   |
| 428   | Timer expired.   Token expired                                                          |
   
---      
   
## user-PUT   
**(Store an entity at a URI)**   
### General Information   
    Required data: payload → address, password, name 
	               queryStringObject → email 
                   headers → token
    Optional data: None
    Procedure description:  1. Validate token
                            2. Validate if user exists in database/file
                            3. Update user data   
> Updates all or some fields of a user.  A valid token must be send or an error message will be return.   

### Path and Required Data
   
| Path                            | Parameters |  Headers                 | e.g.                                                  |
| ---                             | ---        | ---                      | ---                                                   |
| /users?email=some@validmail.com | email      | tokenId **`(required)`** | http://localhost:3000/users?email=some@validemail.com |
|                                 | name       |                          |                                                       |
|                                 | address    |                          |                                                       |   

> At least one field (parameter) must be provided, or returns an error message.   

   

### user-put-Response   

```javascript
{
   statusCode: 200,
   message: 'User updated successfully',
   data: {
      email,
      address,
      name
   }
}
```   
   
### user-put-Errors    
      
| Error | Parameters                                                        |
| ---   | ---                                                               |
| 403   | Permission denied... Insufficient permissions.  Email is required |
| 403   | Permission denied... Insufficient permissions.  Token is required |
| 403   | Permission denied... Insufficient permissions                     |
| 403   | Permission denied... Insufficient permissions                     |
| 404   | No data available.  User not found                                |
| 404   | No data available.  User has not been updated                     |
| 404   | No data available.  Token not found                               |
| 404   | No such file or directory.  Required file does not exist          |
| 405   | Operation not permitted.  Email cannot be updated                 |
| 412   | Invalid argument.  Missing or invalid required fields             |
| 428   | Timer expired.   Token expired                                    |
   
---      
   
## user-DELETE   
**(Request that a resource be removed)**   
### General Information
    Required data: payload → email
                   headers → token
    Optional data: None
    Procedure description:  1. Validate token
                            2. Validate if user exists in database/file
                            3. Delete: token, shopping cart (if exists in user), user

### Path and Required Data
   
| Path                            | Parameters |  Headers                 | e.g.                                                  |
| ---                             | ---        | ---                      | ---                                                   |
| /users?email=some@validmail.com | None       | tokenId **`(required)`** | http://localhost:3000/users?email=some@validemail.com |   

### user-delete-Response   

```javascript
{
   statusCode: 200,
   message: 'User deleted successfully',
   data: { }
}
```   
   
### user-delete-Errors    
      
| Error | Parameters                                                                |
| ---   | ---                                                                       |
| 403   | Permission denied... Insufficient permissions                             |
| 404   | No data available.  Token not found                                       |
| 404   | No such file or directory                                                 |
| 405   | Operation not permitted. User associated with email has not been deleted  |
| 405   | Operation not permitted. Token associated with email has not been deleted |
| 405   | Operation not permitted. User associated with email does not exist        |
| 412   | Invalid argument.  Missing or invalid required fields                     |
| 428   | Timer expired.   Token expired                                            |

---   
# Credits
* Code: or73
