var utility = require("./utility.js"); //store for functions not in the standard template

var DB = {}; //object to export that will contain all of the templated functions 

var userpass= '';
var username = '';
var	database_name = '';
var callback = '';
var cookies = '';

module.exports = DB;

DB.setup = function  (config) {
	var couch_host = 'http://' + config.host + ':' + config.port
	DB.nano = require('nano')(couch_host)
	  , username = config.username
	  , userpass = config.password
	  , callback = console.log // this would normally be some callback
	  , cookies  = {} // store cookies, normally redis or something
	  , database_name = config.name
}

DB.update = function  (newData,callback) {
	var client = DB.nano.use(database_name); //sets it to the right database
	if (newData.username === null){
		callback('user_not_found');
	}
	client.get(newData.username, function (e,r) {

		if(r === undefined) {
	    	callback('user_not_found');
	    	return;
	    }
	    for (var attrname in newData) { 
	    	r[attrname] = newData[attrname]; 
	    }
	    client.insert(r, r.username, function (e, r) {
    		if(e) {
    			callback(e);
    		} else {
    			callback(null,'ok'); //success!
    		}
		});
	});
}



DB.insert = function  (record,callback) {
	var client = DB.nano.use(database_name); //sets it to the right database
	client.insert(record, record.username, function(e, body){
		if (e) { //if error means document already exists in database
			//console.log('...stuffInACouch.js: username already exists', e.message);
			callback('record_exists');
		} else {
			//console.log('...stuffInACouch.js: ', record.username, 'successfully created'); //success!
			callback(null,'ok');
		}
	});
}

//getByUsername
//in: username, callback 
DB.getByUsername = function  (username, callback) {
	var client = DB.nano.use(database_name); //sets it to the right database
	
	client.get(username, function (e,r) {
		if (e){
			//console.log('...stuffInACouch.js: account ',e.error);
			callback('user_not_found',null);
		}
		else{
			//console.log('...stuffInACouch.js: account found');
			callback(null,r);
		}
	});
}

//getByEmail
//in: username, callback 
DB.getByEmail = function  (email, callback) {
	var client = DB.nano.use(database_name); //sets it to the right database
	
	client.view('userAccount','email', {key: email}, function(e, r){ //checks to see if email is already registered
		if (r === null || r === undefined)
		{
			callback('user_not_found', null);
		}
		else if((r.rows).length === 0) //email already exists
		{
			callback('user_not_found',null);
		}
		else //email already exists
		{
			var id = r.rows[0].id;
			DB.getByUsername(id,callback);
		};
	});
}

//sets up the Db 
DB.buildDB = function(callback) {
	DB.nano.db.create(database_name, function(err, body) {
		var client = DB.nano.use(database_name); //sets it to the right database
		if (err) {
			//console.log('...stuffInACouch: database already created! ' + err);
			utility.buildViews(client);
			callback(null);
		}
		else {
			//console.log('...stuffInACouch: created database, loading views');
			utility.buildViews(client);
			callback(null);
		}
	});
}
//destroy the DB created by accountManager
DB.destroyDB = function(callback) { //because some men just want to watch the world burn
	DB.nano.db.destroy(database_name, function(err, body) {
		if (err) {
			//console.log('...stuffInACouch: database not destroyed!' + err);
			callback(err);
		}
		else {
			//console.log('...stuffInACouch: destroyed database');
			callback(null);
		}
	});
};