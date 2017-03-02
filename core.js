"use strict"; 

var _ = require('lodash');
var request = require('request-promise');
var extend = require('extend');
var baseUrl = 'https://frinkiac.com/api/search';
var captionBaseUrl = 'https://frinkiac.com/api/caption';
var imgBaseUri = 'https://frinkiac.com/img/{episode}/{timestamp}/{size}.jpg';

function Core(logger) {
    var self = this;
    self.logger = logger;    
    self.search = function(query) {
        return request({
            method: 'GET',
            uri: baseUrl,
            qs: { q: query },
            json: true
        })
        .then(function (scenes) {
            return scenes.slice(0, 50);
        })
        .map(function (scene) {
            var imgUri = imgBaseUri
                .replace('{episode}', scene.Episode)
                .replace('{timestamp}', scene.Timestamp);
            scene = extend(scene, { 
                ImageUri: imgUri.replace('{size}', 'medium'),
                ThumbnailUri: imgUri.replace('{size}', 'small') 
            });
            return request({
                method: 'GET',
                uri: captionBaseUrl,
                qs: { e: scene.Episode, t: scene.Timestamp },
                json: true
            })
            .then(function (sceneCaption) {
                var caption = _.map(sceneCaption.Subtitles, function(subtitle) {
                    return subtitle.Content;
                }).join(' / ');
                return extend(scene, { Caption: caption });
            });
        });
    };
}

module.exports = function (logger) {
    return new Core(logger);
};