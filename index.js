var mongodb = require('mongodb');
require('dotenv').config();
var ObjectID = mongodb.ObjectID;
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-Parser');
const { response } = require('express');



var genRandomString = function (length){
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};


var sha512 = function (password, salt) {
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};

function saltHashPassword(userPassword) {
    var salt = genRandomString(16);
    var passwordData = sha512(userPassword, salt);
    return passwordData;
}
function checkHashPassword(userPassword, salt) {
    var passwordData = sha512(userPassword, salt);
    return passwordData;
}

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var MongoClient = mongodb.MongoClient;

var url = 'mongodb+srv://Melfin:Melfin123@cluster0.xjwwk.mongodb.net/test'

MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    if (err) {
        console.log('unable to connect to the mongoDB server.Error', err)
    }
    else {

        app.post('/register', (request, response, next) => {

            var post_data = request.body;
            var plaint_password = post_data.password;
            var hash_data = saltHashPassword(plaint_password);
            var password = hash_data.passwordHash;
            var salt = hash_data.salt;

            var name = post_data.name;
            var email = post_data.email;

            var insertJson = {
                'email': email,
                'password': password,
                'salt': salt,
                'name': name
            };

            var db = client.db('geofence');

            db.collection('user').find({ 'email': email }).count(function (err, number) {
                if (number != 0) {
                    response.json('Email already exists');
                    console.log('Email already exists');
                }
                else {

                    db.collection('user').insertOne(insertJson, function (error, res) {

                        response.json('Registration Success');
                        console.log('Registration Success');
                    })
                }

            })
        });



        app.post('/login', (request, response, next) => {

            var post_data = request.body;
            var email = post_data.email;
            var userPassword = post_data.password;


            var db = client.db('geofence');

            db.collection('user').find({ 'email': email }).count(function (err, number) {
                if (number == 0) {
                    response.json('Email does not exists');
                    console.log('Email does not exists');
                }
                else {

                    db.collection('user').findOne({ 'email': email }, function (err, user) {
                        var salt = user.salt;
                        var hashed_password = checkHashPassword(userPassword, salt).passwordHash;
                        var encrypted_password = user.password;
                        if (hashed_password == encrypted_password) {

                            response.json('Login Success');
                            console.log('Login Success');

                        } else {
                            response.json('wrong password');
                            console.log('incorrect password');
                        }
                    })
                }

            })
        });


        app.listen(process.env.PORT, () => {

            console.log('Connected to mongoDB server, webservice running on port 3000');

        })
    }
              

});