const debug = require('debug')('blue-boomerang:routes/videos');
const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const moment = require('moment');
require('dotenv').config();

const router = express.Router();

aws.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
});
const s3 = new aws.S3();

router.get('/', (req, res) => {
  const params = {
    Bucket: process.env.S3_BUCKET
  };
  s3.listObjectsV2(params, (error, data) => {
    if (error) {
      debug('error:', error);
      return res.send(error);
    }
    const copy = Object.assign({}, data);
    let contents = copy.Contents.map(item =>
      (Object.assign({}, item,
        {
          Url: `${process.env.S3_BASE_URL}/${item.Key}`,
          TimeAgo: moment(item.LastModified).fromNow(true)
        })));
    if (req.query.rid) {
      const rid = req.query.rid;
      contents = contents.filter(item => item.Key.split('/')[1] === rid);
      copy.KeyCount = contents.length;
    }
    copy.Contents = contents;
    debug(copy);
    return res.send(copy);
  });
});

router.get('/:id', (req, res) => {
  res.send('GET video by id');
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    metadata: (req, file, callback) => {
      callback(null, file);
    },
    key: (req, file, callback) => {
      const rid = req.query.rid;
      const name = `stories/${rid}/${Date.now()}/${file.originalname}`;
      callback(null, name);
    },
    acl: 'public-read'
  })
});

if (process.env.FEATURE_ENABLE_UPLOAD_VIDEO === 'true') {
  router.post('/', upload.single('video'), (req, res) => {
    const rid = req.query.rid;
    debug(`${req.file.originalname} has been successfully uploaded.`);
    return res.redirect(`/?rid=${rid}`);
  });
} else {
  router.post('/', (req, res) => {
    const message = 'FEATURE_ENABLE_UPLOAD_VIDEO has been disabled.';
    debug(message);
    throw Error(message);
  });
}

module.exports = router;
