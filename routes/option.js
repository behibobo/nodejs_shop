const express = require('express');
const common = require('../lib/common');
const colors = require('colors');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/admin/options', common.restrict, (req, res, next) => {
    console.log('here');
    const db = req.app.db;
    // get the top results
    db.opts.find({}).toArray((err, topResults) => {
        if(err){
            console.info(err.stack);
        }
        res.render('options', {
            title: 'Cart',
            top_results: topResults,
            session: req.session,
            admin: true,
            config: req.app.config,
            message: common.clearSessionValue(req.session, 'message'),
            messageType: common.clearSessionValue(req.session, 'messageType'),
            helpers: req.handlebars.helpers
        });
    });
});

// insert form
router.get('/admin/option/new', common.restrict, common.checkAccess, (req, res) => {
    res.render('option_new', {
        title: 'New Option',
        session: req.session,
        optionTitle: common.clearSessionValue(req.session, 'optionTitle'),
        editor: true,
        admin: true,
        helpers: req.handlebars.helpers,
        config: req.app.config
    });
});
module.exports = router;
