const express = require('express');
const router = express.Router();
const controller = require('../controllers/dataController');

router.get('/data', controller.fetchData);
router.get('/toggle-ac', controller.toggle);

module.exports = router;