const debug = require('debug')('blue-boomerang:routes/videos');
const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

const router = express.Router();

router.get('/', (req, res) => {
  res.send('GET videos');
});

router.get('/:id', (req, res) => {
  res.send('GET video by id');
});

aws.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
});
const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    metadata: (req, file, callback) => {
      callback(null, file);
    },
    key: (req, file, callback) => {
      const name = `videos/${Date.now()}/${file.originalname}`;
      callback(null, name);
    },
    acl: 'public-read'
  })
});

if (process.env.FEATURE_ENABLE_UPLOAD_VIDEO === 'true') {
  router.post('/', upload.single('video'), (req, res) => {
    debug(`${req.file.originalname} has been successfully uploaded.`);
    return res.redirect('/');
  });
} else {
  router.post('/', (req, res) => {
    const message = 'FEATURE_ENABLE_UPLOAD_VIDEO has been disabled.';
    debug(message);
    throw Error(message);
  });
}

module.exports = router;
