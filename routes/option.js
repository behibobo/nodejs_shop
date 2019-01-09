const express = require('express');
const common = require('../lib/common');
const colors = require('colors');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/admin/options', common.restrict, (req, res, next) => {
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

// insert new product form action
router.post('/admin/option/insert', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

    let doc = {
        optionTitle: req.body.frmOptionTitle,
        optionValues: req.body.frmOptionValues,
    };

    db.opts.insert(doc, (err, newDoc) => {
        if(err){
            console.log(colors.red('Error inserting document: ' + err));

            // keep the current stuff
            req.session.optionTitle = req.body.frmOptionTitle;
            req.session.optionTags = req.body.frmOptionValues;

            req.session.message = 'Error: Inserting product';
            req.session.messageType = 'danger';

            // redirect to insert
            res.redirect('/admin/option/new');
        }else{
            req.session.message = 'New option successfully created';
            req.session.messageType = 'success';
                // redirect to options
            res.redirect('/admin/options');
        }
    });
});

// render the editor
router.get('/admin/option/edit/:id', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;
    db.opts.findOne({_id: common.getId(req.params.id)}, (err, result) => {
        if(err){
            console.info(err.stack);
        }
  res.render('option_edit', {
            title: 'Edit product',
            result: result,
            admin: true,
            session: req.session,
            message: common.clearSessionValue(req.session, 'message'),
            messageType: common.clearSessionValue(req.session, 'messageType'),
            config: req.app.config,
            editor: true,
            helpers: req.handlebars.helpers
        });
    });
});


// Update an existing product form action
router.post('/admin/option/update', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

    db.opts.findOne({_id: common.getId(req.body.frmOptionId)}, (err, product) => {
        if(err){
            console.info(err.stack);
            req.session.message = 'Failed updating option.';
            req.session.messageType = 'danger';
            res.redirect('/admin/option/edit/' + req.body.frmOptionId);
            return;
        }

      let optionDoc = {
          optionTitle: common.cleanHtml(req.body.frmOptionTitle),
          optionValues: common.cleanHtml(req.body.frmOptionValues),
      };

      db.opts.update({_id: common.getId(req.body.frmOptionId)}, {$set: optionDoc}, {}, (err, numReplaced) => {
          if(err){
              console.error(colors.red('Failed to save option: ' + err));
              req.session.message = 'Failed to save. Please try again';
              req.session.messageType = 'danger';
              res.redirect('/admin/option/edit/' + req.body.frmProductId);
          }else{
            req.session.message = 'Successfully saved';
            req.session.messageType = 'success';
            res.redirect('/admin/options');
          }
      });

    });
});

// delete product
router.get('/admin/option/delete/:id', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

    // remove the article
    db.opts.remove({_id: common.getId(req.params.id)}, {}, (err, numRemoved) => {
      if(err){
          console.info(err.stack);
      }
      req.session.message = 'Option successfully deleted';
      req.session.messageType = 'success';
      res.redirect('/admin/options');
    });
});


module.exports = router;
