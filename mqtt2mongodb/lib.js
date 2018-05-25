var ssu = require('./config.json');
var fs = require('fs');
var crypto = require('crypto'); //ONLY WITH AUTHORIZATION

function collectDeciph()
{

    //--------- CHECK IF AUTHORIZATION KEYS EXIST ---------//
     function kfileExistence()
     {
         try
         {
            fs.accessSync(ssu.DGL.p + 'd/meta.json', fs.F_OK);
            var keysFound = true;
         }
         catch(e)
         {
            keysFound = false;
         }
         return keysFound;
      }
      //---------------------------------------------------//

      var kf = kfileExistence();

      //--------- IF KEYS EXIST START DECIPHERING ---------//
      function startDeciph()
      {
         if (kf == true)
         {
            var poa = require (ssu.DGL.p + 'd/meta.json')

            const chain0 = crypto.createDecipheriv('aes-128-cbc',
                                                    poa.asegk.ky,
                                                    poa.asegk.iv);
            let mqu = chain0.update(ssu.MQTT.user, 'hex', 'utf-8');
            mqu += chain0.final('utf-8');

            const chain1 = crypto.createDecipheriv('aes-128-cbc',
                                                   poa.asegk.ky,
                                                   poa.asegk.iv);
            let mqp = chain1.update(ssu.MQTT.pass, 'hex', 'utf-8');
            mqp += chain1.final('utf-8');

            const chain2 = crypto.createDecipheriv('aes-128-cbc',
                                                    poa.asegk.ky,
                                                    poa.asegk.iv);
            let mgu = chain2.update(ssu.MONGO.user, 'hex', 'utf-8');
            mgu += chain2.final('utf-8');

            const chain3 = crypto.createDecipheriv('aes-128-cbc',
                                                   poa.asegk.ky,
                                                   poa.asegk.iv);
            let mgp = chain3.update(ssu.MONGO.pass, 'hex', 'utf-8');
            mgp += chain3.final('utf-8');

            return [mqu, mqp, mgu, mgp]; // RETURN VALID VALUES
         }
         else
         {
             //console.log("Authorization file not found!");//FOR DEBUG
             return ["0", "0", "0", "0"]; // RETURN ZERO IF FILE NOT FOUND
         }
      };
      //------------------------------------------------------//

      var data = startDeciph();
      return data;
};

function bkParseErr()
{
  console.log("Bad Karma. Check error log"); // FOR DEBUG
  fs.appendFile('error.log', "|---- BAD KARMA ----|\n" +
                             "JSON parse error" + "\n" +
                             "WHEN : " + new Date()    +
                                      "\n"             +
                             "\n" + "\n" , function (err)
                                           {
                                              if (err) throw err;
                                           })
}

function bkAuthErr()
{
  console.log("Authorization System Failure. Check error log");// FOR DEBUG
  fs.appendFile('error.log', "|--- Authorization System Failure ---|" +
                             "\n" + "WHEN : " + new Date() + "\n" +"\n"
                             , function (err)
                               {
                                  if (err) throw err;
                               })
}

function newAsgnLog()
{
  console.log("Insert doc in freshly created object collection. Check assign log");// FOR DEBUG
  fs.appendFile('assign.log', "New object assigned with ID: " +
                               objectID                       +
                               " -- "                         +
                               "when:" + new Date() + "\n", function(err)
                                                            {
                                                               if (err) throw err;
                                                            })
}
//------------------------- EXPORTS --------------------------//
module.exports =
{
    mAuth: collectDeciph,
    prsErr: bkParseErr,
    authErr: bkAuthErr,
    newAsgn: newAsgnLog
};
