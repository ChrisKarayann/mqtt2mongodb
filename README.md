# mqtt2mongodb
Storing MQTT messages to mongoDB - with a simple touch of security. 
This script is designed to work with a weather station (an object in general) - or more than one - which sends a 
JSON encoded MQTT message  to a server running a mosquitto broker. The script runs continuously on the server waiting 
for incoming messages and   stores them in mongoDB.

|- PHILOSOPHY -|
The sender of MQTT messages uses a SIM module / modem to send messages on air. For object identification the module's
IMEI is extracted and used as "id" key JSON.
  
Once the message contacts server it gets parsed. The "id" key is extracted to be used as collection name where the rest of
data will be stored. Then the key is deleted and a timestamp key is added.
  
Each new object creates it's own collection.
  
The collection is capped to avoid ultra large collections - can be modified on ones discretion.
  
The script logs errors while parsing the message (in error.log)  to avoid crashing and also logs new entries (assign.log))
- if a new object publish  a new collection with that object's IMEI as name will appear in the database.
The log files are created on the fly - no need to be present.
  
The only mandatory file to be present is config.json where personalized data are stored and used in the script. The fields
that should be changed are the username and passwords of MQTT broker and mongoDB's database where the collections are gathered
along with the database's name. 
  
  
|- ATTEMPT TO SECURE IT -|
Config.json is good to be hidden.
Usernames and passwords should be encrypted. The script uses AES-128 encryption and a dongle for storing the keys for 
decryption. Once the script starts "listening" - and keeps running - the dongle can be removed. No keys present.
In case the dongle is missing the script won't start.
  
  
