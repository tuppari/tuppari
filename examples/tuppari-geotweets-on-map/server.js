
/**
 * Module dependencies.
 */

var express = require('express'),
    Tuiter = require('tuiter'),
    http = require('http'),
    util = require('util'),
    Tuppari = require('tuppari'),
    keys = require('./keys');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/*
 * Routes
 */

app.get('/', function(req, res){
  res.render('index');
});

var server = http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});

console.log(keys);

var t = new Tuiter(keys.twitterKeys);

var tuppari = new Tuppari(keys.tuppariKeys);
var channel = tuppari.join('geotweets');

//world -180,-90,180,90
//baires -65.6103515625,-40.44694705960048,-56.6015625,-33.28461996888768

t.filter({locations: [{lat: -90, long: -180},{lat: 90, long: 180}]}, function(stream){

  // New tweet
  stream.on("tweet", function(data){
    if (data.geo && data.geo.coordinates) {
      channel.send('update', {
        coordinates: data.geo.coordinates,
        screen_name: data.user.screen_name,
        text: data.text,
        pic: data.user.profile_image_url
      }, function (err, res, body) {
        // console.log(body);
      });
    }
  });

  stream.on("delete", function(data){
    //I don't care about deleted tweets
  });

  // Log errors
  stream.on("error", function(error){
    // handle errors
  });

});

process.on('uncaughtException', function(err){
  util.inspect(err);
});
