var express = require('express')
var router = express.Router()
var ctrs = require('../controllers/index.js')

router.get('/',ctrs.index);

router.get('/select',ctrs.select);

module.exports = router;
