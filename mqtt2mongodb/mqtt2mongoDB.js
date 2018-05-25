//----------------------------- THE LITURGIST -------------------------//
//--------------------- PASSING MQTT DATA TO MONGO DB -----------------//

var fs = require('fs');
var ssu = require('./config.json');
var crypto = require('crypto'); //ONLY WITH AUTHORIZATION
var alib = require('./lib.js');
var mqtt = require('mqtt');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var collectionName = ''; // USED ON INSERTING DOC IN EXISTING COLLECTION
var machineId, messageObj;

//------------------ FIRST OF ALL HANDLE SECURITY ---------------------//
//------------- REMOVE WHOLE BLOCK FOR NO AUTHORIZATION ---------------//
alib.mAuth();
var collected = alib.mAuth(); // KEYS COLLECTED - DRIVE MAY BE REMOVED - NO KEYS PRESENT ON THE SYSTEM
//--------------------- END OF AUTHORIZATION BLOCK --------------------//

if (collected[0] != 0 &&  // REMOVE IF CONDITION IF NO AUTH
    collected[1] != 0 &&
    collected[2] != 0 &&
    collected[3] != 0 )
{ //START OF (IF) - REMOVE PARENTHESIS IF NO AUTH

//------------------- FIX MQTT CONNECTION STRING ----------------------//
var mqClient = mqtt.connect('mqtt://' + ssu.MQTT.host,
                                        {username: collected[0],
                                         password: collected[1]});
//--------------------------------------------------------------------//

//------------------- FIX MONGO CONNECTION STRING --------------------//
const mongoUrl = 'mongodb://' +  collected[2]  + ':'
                              +  collected[3]  + '@'
                              + ssu.MONGO.host + ':'
                              + ssu.MONGO.port + '/'
                              + ssu.MONGO.base;
//--------------------------------------------------------------------//


//------------------ SUBSCRIBE TO LOCAL MQTT SERVER ------------------//
mqClient.on('connect', function()
{
  mqClient.subscribe('objects/raw')
});
//--------------------------------------------------------------------//

//--------- HANDLE THE MESSAGES FROM ALL INSTANCES/OBJECTS -----------//
MongoClient.connect(mongoUrl, function(error, database) // CONNECT TO MONGO
{
  if(error != null)
  {
     throw error;
  }
  mqClient.on('message', function(topic, message) // MESSAGE ARRIVES
  {
     try // TRY SO IF SOMETHING GOES WRONG - CATCH IT
     {
        IDegratedMessage = JSON.parse(message); // MESSAGE WITH ID/IMEI FIELD INSIDE - PARSED
        objectID = IDegratedMessage.id;         // EXPORT THE ID/IMEI TO USE IT AS COLLECTION NAME
        delete IDegratedMessage.id;             // DELETE ID FIELD
        cleanMessage = IDegratedMessage;        // LEFT WITH REST OF MESSAGE
        cleanMessage.when = Date.now();         // INSERT TIMESTAMP IN UNIX TIME

        collectionName = objectID;

//--- CHECK IF COLLECTION ALREADY EXISTS. IF IT'S NOT , CREATE THE ---//
//------- COLLECTION AND LOG THE NEW OBJECT WITH SOME INFO... --------//
        database.listCollections( {"name": objectID} ).next(function(err, collinfo)
        {
           if (!collinfo)
           {
              database.createCollection(objectID, {"capped": true, "size": 560, "max":5 },
              function(err, collection)
              {
                 if (err) throw err;
                 alib.newAsgn();
                 collection.insert(cleanMessage, function(err, result)
                 {
                    if (err) throw err;
                 });
               });
            }
//---------------------------------------------------------------------//
            else //... BUT IF THE COLLECTION EXISTS, JUST INSERT THE DOC
            {

                //console.log("Insert doc in existing object collection...");// FOR DEBUG
                database.collection(collectionName).insertOne(cleanMessage,
                function(err, result)
                {
                   if (err) throw err;
                });
            };
         });
      }
      catch(e) // POSSIBLE PARSE ERROR IS CATCHED HERE AND LOGGED TO A FILE
      {
        alib.prsErr(); 
      }
    });
  });
} // END OF (IF) - REMOVE PARENTHESIS IF NO AUTH

//-------------- REMOVE THIS BLOCK ALSO IF NO AUTH -----------------//
else

{
  alib.authErr();
}
//------------------------------------------------------------------//
