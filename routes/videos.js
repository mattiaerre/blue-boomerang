const debug = require('debug')('blue-boomerang:routes/videos');
const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const moment = require('moment');
const fetch = require('node-fetch');
const abbreviations = require('./abbreviations');
require('dotenv').config();

const router = express.Router();

aws.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
});
const s3 = new aws.S3();

const send = (copy, contents, res) => {
  copy.Contents = contents; // eslint-disable-line
  copy.KeyCount = contents.length; // eslint-disable-line
  return res.send(copy);
};

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
    let contents = copy.Contents
      .map(item =>
        (Object.assign({}, item,
          {
            Url: `${process.env.S3_BASE_URL}/${item.Key}`,
            TimeAgo: abbreviations(moment(item.LastModified).fromNow(true)),
            Rid: Number.parseInt(item.Key.split('/')[1], 10)
          })))
      .filter((item) => {
        if (moment(item.LastModified).add(process.env.TTL, 'hours') >= moment()) {
          return item;
        }
        return null;
      });
    if (req.query.rid) {
      const rid = req.query.rid;
      contents = contents.filter(item => item.Key.split('/')[1] === rid);
    }

    if (contents.length === 0) {
      return send(copy, contents, res);
    }

    const rids = contents
      .map(item => item.Rid)
      .filter((value, index, self) => (self.indexOf(value) === index));

    let counter = 0;
    rids.forEach((rid) => {
      fetch(`https://mobile-api.opentable.com/api/v2/restaurant/${rid}`, {
        headers: {
          Authorization: process.env.AUTHORIZATION
        }
      })
        .then(response => response.json())
        .then((restaurant) => { // eslint-disable-line
          counter += 1;
          contents.map((item) => { // eslint-disable-line
            if (item.Rid === rid) {
              /* eslint-disable */
              item.RestaurantName = restaurant.name;
              item.NeighborhoodName = restaurant.neighborhoodName;
              item.PrimaryCuisineName = restaurant.cuisines[0].name;
              item.ProfilePhotoUrl = restaurant.profilePhoto ? restaurant.profilePhoto.sizes.smallUrl : '';
              item.MetroId = Number.parseInt(restaurant.metroId, 10);
              /* eslint-enable */
            }
          });
          if (counter === rids.length) {
            const metroid = Number.parseInt(req.query.metroid, 10);
            if (metroid) {
              contents = contents.filter(item => item.MetroId === metroid);
            }
            return send(copy, contents, res);
          }
        });
    });
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
  }),
  fileFilter: (req, file, cb) => {
    const rid = req.query.rid;
    debug(
      'rid:', rid,
      'Number.parseInt(rid, 10):', Number.parseInt(rid, 10),
      'Number.isInteger(Number.parseInt(rid, 10)):', Number.isInteger(Number.parseInt(rid, 10)));
    cb(null, Number.isInteger(Number.parseInt(rid, 10)));
  }
});

if (process.env.FEATURE_ENABLE_UPLOAD_VIDEO === 'true') {
  router.post('/', upload.single('video'), (req, res) => {
    if (req.file) {
      debug(`${req.file.originalname} has been successfully uploaded.`);
      const rid = req.query.rid;
      return res.redirect(`/?rid=${rid}`);
    }
    return res.sendStatus(400);
  });
} else {
  router.post('/', (req, res) => { // eslint-disable-line no-unused-vars
    const message = 'FEATURE_ENABLE_UPLOAD_VIDEO has been disabled.';
    debug(message);
    throw Error(message);
  });
}

module.exports = router;
