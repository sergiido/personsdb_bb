const formidable = require('formidable');
const fs = require('fs');

const cloudinary = require('cloudinary');
cloudinary.config({ 
	cloud_name: process.env.cloud_name, 
	api_key: process.env.api_key, 
	api_secret: process.env.api_secret
});
const image_key = process.env.image_key;

const ObjectId = require('mongodb').ObjectID;

console.log('Router: started ...');

const dbname = "mydata";

module.exports = function(app, client) {

	const database = client.db(dbname);

	app.get('/', checkAuth, (req,res) => {
		res.redirect('/app');
	});


	app.get('/collections', (req, res) => {
		database.listCollections().toArray(function(err, collInfos) {
			res.send(collInfos);
		});
	});


	app.get('/login', (req, res) => {
		res.render('login', {title: 'Blotter', 'message': 'Blotter v.' + process.env.npm_package_version, 'errMsg': ''});
	});


	app.post('/login', (req, res) => {
		database.collection("users").findOne({ email: req.body.email, pwd: req.body.pwd, active: true }, function(err, doc) {
			if (doc !== null) {
				// verify active param for the user's group
				// ...
				var oneMin = 60000;
				if (req.body.rememberMe) {
					req.session.cookie.expires = false;
				} else {
					req.session.cookie.expires = new Date(Date.now() + oneMin * 30);
					// req.session.cookie.maxAge = oneMin * 10;
				}
				req.session.user = {
					id: doc._id,
					username: doc.name + " " + doc.secondname,
					email: doc.email,
					role: doc.role //'admin'
				};
				res.redirect('/app');
			} else {
				res.render('login', {title: 'Login', message: 'Login', errMsg: 'login or pwd is not valid(active)'});
			}
		});
	});


	app.get('/register', (req, res) => {
		res.render('register', {title: 'Register', 'message': 'Register', 'errMsg': ''});
	});


	app.post('/register', (req, res) => {
		database.collection("users").findOne({ email: req.body.email}, function(err, user) {
			if (user !== null) {
				res.render('login', {title: 'Login', message: 'Login', errMsg: 'User with '+req.body.email+' e-mail exists'});
			} else {
				database.collection("groups").findOne({ current: true }, function(err, doc) {
					if (err) return;
					// console.log(doc);
					database.collection("users").insert([ {
						name: req.body.name,
						secondname: req.body.secondname,
						gender: req.body.gender,
						age: req.body.age,
						groupid: doc.id || "na",
						email: req.body.email,
						// login: req.body.login,
						pwd: req.body.pwd,
						role: req.body.role || "user",
						ava: null,
						created: new Date(),
						lastlogin: null,
						cwork: false,
						active: false }
					], function(err, doc) {
						if (req.session.user && req.session.user.role == 'admin') {
							res.redirect('/app');
						} else {
							res.render('login', {title: 'Login', message: 'Login', errMsg: 'Thank\'s for registration!'});
						}
					});
				});
			}
		});
	});


	app.post('/register2', (req, res) => {
		var form = new formidable.IncomingForm();
		// form.uploadDir = __dirname + '/../public/uploads';
		// form.keepExtensions = true;

		form.parse(req, function(err, fields, file) {
			// console.log('Got file: ', JSON.stringify(file.ava));
			// console.log('Got fields: ', fields);
			// console.log('form.uploadDir: ', form.uploadDir);
			// fs.rename(file.ava.path, __dirname + '/../public/uploads/' + file.ava.name, function(err) {
			// 	if ( err ) console.log('ERROR: ' + err);
			// });

			database.collection("users").findOne({ email: fields.email}, function(err, user) {
				if (user !== null) {
					res.render('login', {title: 'Login', message: 'Login', errMsg: 'User with '+ fields.email +' e-mail exists'});
				} else {
					database.collection("groups").findOne({ current: true }, function(err, doc) {
						if (err) return;
						// console.log(doc);
						// file.ava.path = form.uploadDir + file.ava.name;
						if (file.ava.name !== "") {
							cloudinary.v2.uploader.upload(
								file.ava.path, 
								{ 
									public_id: file.ava.name.split('.').slice(0, -1).join('.'),
									eager: [ 
										{ width: 100, height: 100, crop: 'thumb', gravity: 'face'}
									],                                     
								    tags: ['qastartup']
								}, 
								function(err, image) { 
									//console.log ("cloudinary: " + JSON.stringify(image));
								});
						}

						database.collection("users").insert([ {
							name: fields.name,
							secondname: fields.secondname,
							gender: fields.gender,
							age: fields.age,
							groupid: doc.id,
							email: fields.email,
							// login: req.body.login,
							pwd: fields.pwd,
							role: "user",
							ava: file.ava.name || null,
							created: new Date(),
							lastlogin: null,
							cwork: false,
							active: false }
						], function(err, doc) {
							if (req.session.user && req.session.user.role == 'admin') {
								res.redirect('/app');
							} else {
								res.render('login', {title: 'Login', message: 'Login', errMsg: 'Thank\'s for registration!'});
							}
						});
					});
				}
			});
		});
	});


	app.get('/app', checkAuth, (req,res) => {
		var allowedUsers = ['admin', 'viewer'];
		if ( allowedUsers.indexOf(req.session.user.role) > -1 ) {
			res.render('app', {title: 'Users list', user: req.session.user, img_api_key: image_key}); //, 'data': docs});
		} else {
			// console.log(req.session.user.id);
			database.collection("users").findOne({ _id: ObjectId(req.session.user.id)}, function(err, user) {
				// console.log(user.groupid);
				database.collection("users").updateOne({ "_id" : ObjectId(req.session.user.id) }, {$set: {"lastlogin": new Date()}});
				if (!user.cwork) {
					res.render('survey', {userdata: req.session.user});
				} else {
					database.collection("cworks").find({userid: req.session.user.id}).toArray(function(err, docs){
						res.render('cworks', {data: docs, user: req.session.user});
					});
				}
			});
		}
	});


	app.get('/users', checkAuth, (req,res) => {
		database.collection("users").find({}).toArray(function(err, docs){
			if(err) return;
			res.json(docs);
		});
	});


	app.get('/adduser', checkAuth, (req,res) => {
		database.collection("groups").find({}).toArray(function(err, docs) {
			// res.json(docs);
			res.render('adduser', {title: 'Add user', user: req.session.user, message: 'Add user', groups: docs});
		});
	});


	app.get('/tojson/:id', checkAuth, function(req, res) {
		database.collection("groups").find({_id: ObjectId(req.params.id) }).toArray(function(err, doc){
			// console.log(doc[0]);
			if(err) return;
			database.collection("users").find({groupid: doc[0].id}).toArray(function(err, docs){
				res.header('Access-Control-Allow-Origin', '*');
				res.send(JSON.stringify(docs));
			});
		});
	});

	app.get('/user/:id', checkAuth, (req, res) => {
		database.collection("users").find({ "_id" : ObjectId(req.params.id) }).toArray(function(err, docs){
			//console.log(JSON.stringify(docs));
			res.render('edituser', {title: 'Edit user', user: docs, message: 'Edit user'});
		});
	});

	app.put('/user/:id', checkAuth, (req, res) => {
		database.collection("users").updateOne({ "_id" : ObjectId(req.params.id) }, {$set: {"active": req.body.active}});
		// console.log(req.body.active);
		res.sendStatus(200);
	});

	app.delete('/user/:id', checkAuth, (req, res) => {
		// console.log(req.params.id);
		database.collection("users").deleteOne( { "_id" : ObjectId(req.params.id) } );
		res.sendStatus(200);
	});


	app.get('/groups', checkAuth, (req, res) => {
		/*database.collection("groups").find({}).toArray(function(err, docs) {
			res.json(docs);
		});*/

		database.collection("groups").aggregate(
			[
				{
					$lookup:
					{
						from: "users",
						localField: "id",
						foreignField: "groupid",
						as: "usersList"
					}
				},
	            { "$project": {
					_id: 1,
					id: "$id",
					name: "$name",
					current: "$current",
					active: "$active",
					numOfUsers: {$size:"$usersList"}
	            }}
			]
		).toArray(function(err, docs) {
			// console.log(JSON.stringify(docs));
			res.json(docs);
		});
	});


	app.get('/group/:id/users', checkAuth, (req, res) => {
		database.collection("groups").find({id: req.params.id}).toArray(function(err, group){
			if (err) return;
			if (group[0]) {
				// console.log("group #:" + req.params.id + " found");
				database.collection("users").find({groupid: group[0].id}).toArray(function(err, users){
					res.json(users);
				});
			} else {
				console.log("group not found");
				res.sendStatus(404);
			}
		});
	});


	app.post('/group', checkAuth, (req, res) => {
		console.log("added a new group " + req.body.name);
		database.collection("groups").findOne({}, { "sort": ({'id':-1}) } , function(err, doc) {
		    // console.log("Max id: " + doc.id);
		    req.body.id = (parseInt(doc.id)+1).toString();
			database.collection("groups").insert(req.body)
				.then((group) => res.send(group) )
				.catch(err => res.status(200).json({message: "failed to add the group"}));
		}); 
	});


	app.put('/group/:id', checkAuth, (req, res) => {
		console.log('PUT: ' + req.params.id );
		console.log(JSON.stringify(req.body));
		database.collection("groups").updateOne( { id: req.body.id}, { $set: { "name": req.body.name, "active": req.body.active} });
		res.sendStatus(200);
	});


	app.delete('/group/:id', checkAuth, (req, res) => {
        // console.log('DELETE: ' + req.params.id);
		database.collection("groups").deleteOne( { "id" : req.params.id } );
		res.sendStatus(200);
	});


	app.get('/group/update/current/:id', (req,res) => {
		//let id = parseInt(req.params.id);
		let id = req.params.id;
		database.collection("groups").updateOne( { current: true}, { $set: { current: false } },
			function (err, result) {
				database.collection("groups").updateOne( { id: id }, { $set: { current: true } });
				res.sendStatus(200);
			});
	});

	app.post('/survey', (req, res) => {
		//console.log(req.body);
		//console.log(req.session.user.id);
		if (req.session.user) {
			database.collection("users").updateOne({ "_id" : ObjectId(req.session.user.id) }, {$set: {"cwork": true}});
			database.collection("cworks").insert([ {
				userid: req.session.user.id,
				username: req.session.user.username,
				created: new Date(),
				answer: req.body }
			], function(err, doc) {
				if (err) {
					console.log("err: " + err);
					return;
				}
				// console.log(doc);
				res.redirect('/app');
			});
			//const answer = '<h3>Q1: </h3> <p>' + (req.body.q1).replace(/</g, "&lt;").replace(/>/g, "&gt;")+ '</p> \
			//	<h3>Q2: </h3> <p>' + (req.body.q2).replace(/</g, "&lt;").replace(/>/g, "&gt;")+ '</p> \		';
		} else {
			res.redirect('/login');
		}
	});

	app.get('/view/cworks', checkAuth, (req,res) => {
		database.collection("cworks").find({}).toArray(function(err, docs){
			res.render('cworks', {data: docs, user: req.session.user});
		});
	});

	app.get('/delete/cworks', checkAuth, (req, res) => {
		database.collection("cworks").remove({});
		res.redirect('/app');
		// res.sendStatus(200);
	});
	
	app.get('/delete/cwork/:id', checkAuth, (req, res) => {
		database.collection("cworks").find({ "_id" : ObjectId(req.params.id) }).toArray(function(err, docs){
			// console.log(JSON.stringify(docs));
			database.collection("users").updateOne({ "_id" : ObjectId(docs.userid) }, {$set: {"cwork": false}});
		});
		database.collection("cworks").deleteOne( { "_id" : ObjectId(req.params.id) } );
		res.sendStatus(200);
	});

 	app.get('/logout', function(req, res) {
		if (req.session.user) {
			delete req.session.user;
		}
		res.redirect('/login');
	});


	function checkAuth(req, res, next) {
		if (typeof req.session.user == 'undefined') {
			res.redirect('/login');
		} else {
			next();
		}
	}
}
