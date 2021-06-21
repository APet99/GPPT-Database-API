# GPPT API Documentation

### Current API Location: [ http://nameless-refuge-33112.herokuapp.com]( http://nameless-refuge-33112.herokuapp.com)
Important: Authorization is required to successfully reach the API. In the header of each request ```Authorization : Basic <YourAPIKey>``` must be included.

Any requests that contain a JSON body, must also include the header ```content-type : application/json```.

---
## Save Data Manipulation ( /saves)

#### POST

|        endpoint      | parameters       | Description                               | Returns                   |
| :---                 | :---             |       :---                                |     ---:                  |
| ```/add ```          |json body         | Adds a single user's save to the database.| json object               |
| ```/addMultiple```   |json body         | Takes a single save box containing multiple saves, and adds each containing save.                                 | Array of json objects     |




---
#### GET

|        endpoint           | parameters                                                            | Description                                                                    | Returns       |
| :---                      |       :---                                                            |       :---                                                                     |:---           |
| ```/getByName ```         |steamName                                                              | Gets a save instance belonging to a steam name                                 |json object    |
| ```/getByID```            |steamID                                                                | Gets a save instance belonging to a steam ID                                   |  json object  |
| ```/get```                |steamName and/or steamID                                               | Gets a save instance belonging to a steam name and/or steam ID                 |  json object  |
| ```/getMultipleByName```  |userNames: Array of steam IDs associated with saves to retrieve.       | Gets multiple save instances belonging to an array of steam names              |  json array   |
| ```/getAll```             |                                                                       | Gets all save instances                                                        |  json object  |
| ```/doesSaveExist```      |steamName and/or steamID                                               | Determines if a save instance is found for a given steam name or steam ID      | json / boolean|


---
#### PUT

|        endpoint           | parameters                  | Description                                                                          | Returns       |
| :---                      |       :---                  |       :---                                                                           |:---           |
| ```/updateName ```        |steamName and newName        | Updates the steam Name of a save (In cases where steam name is changed)              | json object   |
| ```/replaceByName```      |steamName and json body      | Replaces a save instance belonging to steamName with the contents of json body       | json object   | 
| ```/replaceByID```        |steamID                      | Replaces a save instance belonging to steamID with the contents of json body         | json object   |

---
#### DELETE

|        endpoint           | parameters                                 | Description                                        | Returns       |
| :---                      |       :---                                 |       :---                                         |:---           |
| ```/deleteByName ```      |steamName                                   | Deletes a save instance belonging to a a steam name|               |
| ```/deleteByID```         |steamID                                     | Deletes a save instance belonging to a steam ID    |               |
| ```/deleteAll```          |confirmation (Must match "ConfirmDeleteAll")| Deletes all save instances                         |               |

---

Last Updated: 06/21/21