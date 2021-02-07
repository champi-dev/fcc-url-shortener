require('dotenv').config();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const dns = require('dns'); 
const app = express();

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

// Mongodb atlas database :)
mongoose.connect('mongodbkey', { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

const shortenedUrlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

const ShortenedUrl = new mongoose.model('ShortenedUrl', shortenedUrlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Challenge endpoints
app.post('/api/shorturl/new', (req, res) => {
  const parsedUrl = parseStrUrl(req.body.url)

  dns.resolve(parsedUrl.split('/')[0], async (err) => {
    if (err) {
      console.log(err)
      res.json({ error: 'invalid url' });
    } else {
      const shortenedUrl = await ShortenedUrl.findOne({ original_url: parsedUrl }).exec();
  
      if (shortenedUrl) {
        res.json(shortenedUrl);
      } else {
        const urlToHash = parsedUrl;
        const hashedUrl = crypto.createHash('md5').update(urlToHash).digest('hex');

        const shortenedUrl = new ShortenedUrl({
          original_url: req.body.url,
          short_url: hashedUrl
        });

        await shortenedUrl.save();
        res.json({
          original_url: shortenedUrl.original_url,
          short_url: shortenedUrl.short_url
        });
      }
    }
  });
});

app.get('/api/shorturl/:url', async (req, res) => {
  const shortenedUrl = await ShortenedUrl.findOne({ short_url: req.params.url }).exec();

  if (shortenedUrl) {
    res.redirect(shortenedUrl.original_url);
  } else {
    res.send('none');
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

function parseStrUrl (str) {
  let splittedStr = str.split('://');
  splittedStr = splittedStr.length > 1 ? splittedStr[1] : splittedStr[0];
  return splittedStr;
}