//----------------------------- THE LITURGIST -------------------------//
//--------------------- PASSING MQTT DATA TO MONGO DB -----------------//

var fs = require('fs');
var ssu = require('./config.json')
var mqtt = require('mqtt');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var collectionName = ''; // USED ON INSERTING DOC IN EXISTING COLLECTION
var machineId, messageObj;



//------------------- FIX MQTT CONNECTION STRING ----------------------//
var mqClient = mqtt.connect('mqtt://' + ssu.MQTT.host,
                                        {username: ssu.MQTT.user,
                                         password: ssu.MQTT.pass});
//--------------------------------------------------------------------//

//------------------- FIX MONGO CONNECTION STRING --------------------//
const mongoUrl = 'mongodb://' + ssu.MONGO.user + ':'
                              + ssu.MONGO.pass + '@'
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

MongoClient.connect(mongoUrl, function(error, database) //CONNECT TO MONGO
{
  if(error != null)
  {
     throw error;
  }
  mqClient.on('message', function(topic, message) // MESSAGE ARRIVES
  {
     try // TRY SO IF SOMETHING GOES WRONG - CATCH IT
     {
        IDegratedMessage = JSON.parse(message); //MESSAGE WITH ID/IMEI FIELD INSIDE - PARSED
        objectID = IDegratedMessage.id;         //EXPORT THE ID/IMEI TO USE IT AS COLLECTION NAME
        delete IDegratedMessage.id;             //DELETE ID FIELD
        cleanMessage = IDegratedMessage;        //LEFT WITH REST OF MESSAGE
        cleanMessage.when = Date.now();         //INSERT TIMESTAMP IN UNIX TIME

        collectionName = objectID;

//--- CHECK IF COLLECTION ALREADY EXISTS. IF IT'S NOT , CREATE THE ---//
//------- COLLECTION AND LOG THE NEW OBJECT WITH SOME INFO... --------//
        database.listCollections( {"name": objectID} ).next(function(err, collinfo)
        {
           if (!collinfo)
           {
              database.createCollection(objectID, {"capped": true, "size": 560, "max":5 },//THIS WILL CHANGE TO HOLD MANY MORE ENTRIES
              function(err, collection)
              {
                 if (err) throw err;
                 //console.log("Insert doc in freshly created object collection...");
                 fs.appendFile('assign.log', "pssst!...new object assigned with ID: " +
                                              objectID                                +
                                              "--"                                    +
                                              "when:" + new Date() + "\n", function(err)
                                                                           {
                                                                              if (err) throw err;
                                                                           })
                 collection.insert(cleanMessage, function(err, result)
                 {
                    if (err) throw err;
                 });
               });
            }
//---------------------------------------------------------------------//
            else //... BUT IF THE COLLECTION EXISTS, JUST INSERT THE DOC
            {

                //console.log("Insert doc in existing object collection...");
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
         fs.appendFile('error.log', "//-----------------//\n" +
                                    "//--- BAD KARMA ---//\n" +
                                        e     +    "\n"       +
                                    "//-----------------//\n" +
                                    "WHEN : " + new Date()    +
                                             "\n"             +
                                    "//-----------------//\n" +
                                    "\n" + "\n" , function (err)
                                                  {
                                                     if (err) throw err;
                                                  })
      }
    });
  });
