var progress = require("progress-stream");
const path = require('path');
const ytdl = require('ytdl-core');
const Ffmpeg = require('fluent-ffmpeg');

const settings = window.require('electron-settings');
Ffmpeg.setFfmpegPath(settings.get('FFMPEG_PATH'));

function download(youtubeUrl, fileName, callback) {

  const infoOptions = {
    quality: 'highest'
  }

  fileName = path.join(settings.get('USERHOME'), fileName+'.mp3');

  ytdl.getInfo(youtubeUrl, infoOptions, function(err, info) {

    var downloadOptions = {
      quality: 'highest',
      requestOptions: { maxRedirects: 5 },
      format: ytdl.filterFormats(info.formats, 'audioonly')[0]
    }

    // Setup stream
    var stream = ytdl.downloadFromInfo(info, downloadOptions);
    stream.on("response", function(httpResponse) {

      // TODO: Add event emitter to share progress with caller

      // Build progress var
      var str = progress({
        length: parseInt(httpResponse.headers["content-length"]),
        time: 1000
      });

      // Stream progress listener
      str.on("progress", function(progress) {
        console.log(progress);
      });

      // Start encoding
      var proc = new Ffmpeg({
        source: stream
      })
      .audioBitrate(info.formats[0].audioBitrate)
      .withAudioCodec("libmp3lame")
      .on("error", function(err) {
        callback(err.message);
      })
      .on("end", function() {
        callback(null, "done");
      })
      .saveToFile(fileName);
    });
  });

}

module.exports = {
  downloadMp3
}