'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('/Users/salman/Downloads/twitter-sql-master/db/index.js');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    // client.query("SELECT * FROM tweets", function(err, data){
    //   if(err) next(err);
    //   var allTheTweets = data.rows;
    //   res.render('index', {
    //     title: 'Twitter.js',
    //     tweets: allTheTweets,
    //     showForm: true
    //   });
    // })

  

    let query = `SELECT a.user_id as user_id, content, name, picture_url, a.id as tweet_id from 
    (SELECT * from tweets) a
    LEFT JOIN (SELECT * from users) b
    ON a.user_id = b.id `
    client.query(query, (err, data) => {
      var allTheTweets = data.rows
      console.log(allTheTweets)
      res.render('index', {
        title: 'Twitter.js',
        tweets: allTheTweets,
        showForm: true,
      });
    })
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  // router.get('/users/:username', function(req, res, next){
  //   var tweetsForName = tweetBank.find({ name: req.params.username });
  //   res.render('index', {
  //     title: 'Twitter.js',
  //     tweets: tweetsForName,
  //     showForm: true,
  //     username: req.params.username
  //   });
  // });

  router.get('/users/:username', function(req, res, next){
    client.query('SELECT id FROM users WHERE name = $1', [req.params.username], function (err, result1){
      if(err) next(err);
      let id = result1.rows[0].id;
      console.log(id);
      client.query('SELECT content FROM tweets WHERE user_id = $1', [id], function(err,result2){
      if(err) next(err);
      let tweetsForName = result2.rows;
      client.query('SELECT picture_url FROM users WHERE id = $1', [id], function(err, result3){
        if(err) next(err);
        var pic = result3.rows[0].picture_url;
        res.render('index', {
          title: 'Twitter.js',
          tweets: tweetsForName,
          showForm: true,
          username: req.params.username,
          pic: pic
        })
      })
    })
  })})


  // single-tweet page
  // router.get('/tweets/:id', function(req, res, next){
  //   var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
  //   res.render('index', {
  //     title: 'Twitter.js',
  //     tweets: tweetsWithThatId // an array of only one element ;-)
  //   });
  // });

  router.get('/tweets/:id', function(req, res, next){
    client.query('SELECT * FROM tweets WHERE id = $1', [req.params.id], function(err, data){
      if(err) next(err);
      let tweetsWithThatId = data.rows;
      client.query('SELECT name FROM users WHERE id IN (SELECT user_id FROM tweets WHERE id = $1)', [req.params.id], function(err, name){
        if(err) next(err);
        let username = name.rows[0].name;
        client.query('SELECT picture_url FROM users WHERE name = $1', [username], function(err, result){
          if(err) next(err);
          var pic = result.rows[0].picture_url;
          res.render('index', {
            title: 'Twitter.js', 
            username: username,
            tweets: tweetsWithThatId, // an array of only one element ;-)
            pic: pic
          });
        })
      })
    })
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    // var newTweet = tweetBank.add(req.body.name, req.body.content);
    client.query('INSERT INTO users (name) VALUES($1)', [req.body.name], function(err, result){
      if(err) next(err);
      client.query('SELECT id FROM users WHERE name = $1', [req.body.name], function(err,result){
        if(err) next(err);
        let id = result.rows[0].id;
        client.query('INSERT INTO tweets (user_id, content) VALUES($1, $2)', [id, req.body.content], function(err, result){
          if(err) next(err);
          let newTweet = req.body.content;
          // client.query('SELECT * FROM tweets WHERE  ')
          io.sockets.emit('new_tweet', newTweet);
          res.redirect('/');
        })
      })
    })
  });

  // // replaced this hard-coded route with general static routing in app.js
  

  return router;
}

router.get('/all_Tweets', function(req, res, next){
  client.query('SELECT * FROM tweets', function (err, result) {
  if (err) return next(err); // pass errors to Express
  var tweets = result.rows;
  res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
});
})

