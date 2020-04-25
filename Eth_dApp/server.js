
const express = require('express');
const uniqid = require('uniqid');
const route = require('express').Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const Web3 = require('web3');
const app = express();  
const multer = require('multer');
var upload = multer();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());

var web3 = new Web3('HTTP://127.0.0.1:8545');
var wallet = web3.eth.accounts.privateKeyToAccount('0x3d71535c7d25166e75e44166de0c5156eddd1c44a2a429d7ebacaa29f40d6640');

var mysql      = require('mysql');

var connection = mysql.createConnection({
  host     : 'sophia.cs.hku.hk',
  user     : 'tibrewal',
  password : 'KLIipPTB',
  database : 'tibrewal'
});

connection.connect();

app.post('/create', function(req, res){
    var details = req.body.jsonObject;
    details.identity = uniqid();
    console.log(details);

    query = `Insert into UserIdentity(Identity,FirstName,LastName,PhoneNumber,AadharNumber,Email,Age) values('${details.identity}', '${details.fn}','${details.ln}','${details.phone}','${details.aadhar}','${details.mail}','${details.age}');`

    console.log(query);
    
    connection.query(`Insert into UserIdentity(Identity,FirstName,LastName,PhoneNumber,AadharNumber,Email,Age) values('${details.identity}', '${details.fn}','${details.ln}','${details.phone}','${details.aadhar}','${details.mail}','${details.age}');`, function(err,data){
        if(err) throw err;
        else res.status(200).send({identity: details.identity})
    });
         
})

app.post('/authenticate',upload.none(), (req, res) => {
    var details = req.body.jsonObject;

    var count = details.CountPOI;

    var query = "Insert Into POI(identity, purpose, poi_field, poi_value) VALUES";

    for(var i = 0; i < count; i++){
        if(i+1 == count){
            query = query + `('${details.identity}', '${details.idPurpose}', '${details.POI[i].type}', '${details.POI[i].value}');`
        } else {
            query = query + `('${details.identity}', '${details.idPurpose}', '${details.POI[i].type}', '${details.POI[i].value}'), `
        }
    }

    // var query = `Insert Into POI(identity, purpose, poi_field, poi_value) Values('${details.identity}', '${details.idPurpose}', '${details.idType}', '${details.idVal}');`

    console.log(query);

    connection.query(query, (err, data) => {
        if(err) res.status(400).send({message:err});
        else{
            connection.query(`Select * from POI where Identity='${details.identity}'`, (err, data) => {
                if(err) res.status(400).send({message:err});
                else {
                    if(data.length > 0) {
                        var dataJSON = {};

                        dataJSON["Purpose"] = data[0].purpose;

                        data.forEach(element => {
                            dataJSON[element.poi_field] = element.poi_value;
                        });

                        var signedResponse = {
                            data: dataJSON,
                            UserPublicKey: req.body.jsonObject.UserPublicKey
                        }

                        console.log(web3.eth.accounts.sign(JSON.stringify(signedResponse), wallet.privateKey));

                        res.status(200).send(web3.eth.accounts.sign(JSON.stringify(signedResponse), wallet.privateKey));
                    }   else
                        res.status(400).send({data: false});
                }
            });
        }
    });
})


app.post('/checkID',upload.none(), (req, res) => {
    var details = {};
    details.identity = req.body.jsonObject.identity;

    console.log(details.identity);

    connection.query(`Select * from UserIdentity where Identity='${details.identity}'`, (err, data) => {
        if(err) throw err;
        else{
            if(data.length > 0)
                res.status(200).send(data[0]);
            else
                res.status(400).send({data: false});
        }
    });
})



app.listen(8002, (err) => {
    console.log(`Server is running on port 8002`);
});