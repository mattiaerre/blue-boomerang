const express = require('express');
const fetch = require('node-fetch');
const { name, version } = require('../package');

const router = express.Router();

router.get('/', (req, res, next) => { // eslint-disable-line no-unused-vars, arrow-body-style
  const url = `${req.protocol}://${req.get('host')}/api/v1/videos`;
  return fetch(url)
    .then(response => response.json())
    .then(data => (res.render('index', { title: `${name} v${version}`, data })));
});

module.exports = router;
