const express = require('express');
const bodyParser = require('body-parser'); // reading data from the <form> element
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const session = require('express-session');
const app = express();

const port = process.env.PORT || 5000;

const MongoClient = require('mongodb').MongoClient;

const dbuser = process.env.OPENSHIFT_MONGODB_USER;
const dbpwd = process.env.OPENSHIFT_MONGODB_PWD;
const uri = "mongodb+srv://" + dbuser + ":" + dbpwd + "@cluster0-w7j7u.mongodb.net/";

app.disable('x-powered-by');
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(cookieParser('cookiesecret'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

app.use(session({
	secret: 'sessionsecret',
	resave: false,
	saveUninitialized: false
}));

MongoClient.connect(uri, function(err, client) {
	if (!err) {
		require('./router/router')(app, client);

		app.listen(port, () => {
			console.log("Server: " + ", port " + port);
		});
	} else {
		console.log("not able to db connect...");
	}
});
