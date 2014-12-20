var express = require('express')
var router = express.Router()
var ctrs = require('../controllers/index.js')
var path = require('path')

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({uploadDir:path.join(__dirname,'../public/upload')});


router.get('/',ctrs.index);

//router.get('/select',ctrs.select);

router.get('/companyset',ctrs.getcompanysets);

router.get('/companyset/:setid',ctrs.viewset);

router.get('/compare',ctrs.compare);

router.get('/template',ctrs.tpl);

router.post('/template',ctrs.addtpl);

router.get('/company/:companyid',ctrs.company);

router.post('/upfile',multipartMiddleware,ctrs.upfile);

router.post('/addfile',ctrs.addfile);

router.get('/person/:personid',ctrs.person);

router.all('/compute',ctrs.compute);

module.exports = router;
