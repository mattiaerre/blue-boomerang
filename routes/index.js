const express = require('express');
const { name, version } = require('../package');

const router = express.Router();

router.get('/', (req, res, next) => { // eslint-disable-line no-unused-vars
  res.render('index', { title: `${name} v${version}` });
});

module.exports = router;
