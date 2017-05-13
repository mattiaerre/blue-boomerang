const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.send('GET videos');
});

router.get('/:id', (req, res) => {
  res.send('GET video by id');
});

router.post('/', (req, res) => {
  res.send('POST video');
});

module.exports = router;
