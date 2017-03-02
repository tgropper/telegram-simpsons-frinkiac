"use strict"; 

var app = require('express')();
app.set('port', (process.env.PORT || 5000))
var token = require('./token');
var _ = require('lodash');
var logger = require('winston');
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { level: 'debug' });
logger.add(logger.transports.File, { filename: 'all.log', level: 'info' });
var Core = require('./core')(logger);
var TelegramBot = require('node-telegram-bot-api');

var bot = new TelegramBot(token, {polling: true});
logger.info('bot created');

bot.on('inline_query', function(msg) {
  if (msg.query.length === 0) return;

  logger.log('debug', 'inline_query.received', {
    received: {
      id: msg.id,
      query: msg.query
    }
  });
  
  Core.search(msg.query)
    .then(function(scenes) {
      logger.log('debug', 'inline_query.response', {
        response: {
          id: msg.id,
          count: scenes.length
        }        
      });
      
      if (scenes.length === 0) {
        var inlineEmptyResponse = [{
          id: 'empty',
          type: 'article',
          title: 'Mogumbos! There are no results for query ' + msg.query,
          input_message_content: {
            message_text: 'D\'oh!',
            parse_mode: 'Markdown'
          }
        }];
        
        bot.answerInlineQuery(msg.id, inlineEmptyResponse);  
      }
      else {
        var inlineResponses = _.map(scenes, function(scene, i) {
          return {
            id: scene.Episode + scene.Timestamp,
            type: 'photo',
            photo_file_id: scene.Episode + scene.Timestamp,
            photo_url: scene.ImageUri,
            thumb_url: scene.ThumbnailUri,
            title: scene.Episode,
            description: 'Scene from episode ' + scene.Episode,
            caption: scene.Caption
          };
        });
        
        bot.answerInlineQuery(msg.id, inlineResponses);        
      }
      
    })
    .catch(function (err) {
      logger.error('inline_query.error', {
        error: {
          id: msg.id,
          message: err.message
        }
      })
    });
});

bot.on('text', function(msg) {
  bot.sendMessage(msg.chat.id, 'Skinneeeer, i\'m only allowed to send cool Simpsons scenes using inline mode.\nYou just need to write in any chat something like:\n\n@SimpsonsFrinkiacBot Ay, caramba! \n\nThe results will show up and you will be able to share the scene you were talking about with your friends!', {
    parse_mode: 'Markdown'
  })
});

app.get('/', function(req, res){
  res.send('<h1>Simpsons Frinkiac Bot!</h1>');
});

app.listen(app.get('port'), function() {
  logger.log('info', 'Node app is running on port', app.get('port'));
});