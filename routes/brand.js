const express = require('express');
const common = require('../lib/common');
const colors = require('colors');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/admin/brands', common.restrict, (req, res, next) => {
    const db = req.app.db;
    // get the top results
    db.brands.find({}).sort({'brandAddedDate': -1}).toArray((err, topResults) => {
        if(err){
            console.info(err.stack);
        }
        res.render('brands', {
            title: 'Brands',
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

router.get('/admin/brand/filter/:search', (req, res, next) => {
    const db = req.app.db;
    let searchTerm = req.params.search;
    let brandsIndex = req.app.brandsIndex;
    let lunrIdArray = [];
    brandsIndex.search(searchTerm).forEach((id) => {
        lunrIdArray.push(common.getId(id.ref));
    });
    // we search on the lunr indexes
    db.brands.find({_id: {$in: lunrIdArray}}).toArray((err, results) => {
        if(err){
            console.error(colors.red('Error searching', err));
        }
        res.render('brands', {
            title: 'Results',
            results: results,
            admin: true,
            config: req.app.config,
            session: req.session,
            searchTerm: searchTerm,
            message: common.clearSessionValue(req.session, 'message'),
            messageType: common.clearSessionValue(req.session, 'messageType'),
            helpers: req.handlebars.helpers
        });
    });
});

// insert form
router.get('/admin/brand/new', common.restrict, common.checkAccess, (req, res) => {
    res.render('brand_new', {
        title: 'New brand',
        session: req.session,
        brandTitle: common.clearSessionValue(req.session, 'brandTitle'),
        brandPermalink: common.clearSessionValue(req.session, 'brandPermalink'),
        message: common.clearSessionValue(req.session, 'message'),
        messageType: common.clearSessionValue(req.session, 'messageType'),
        editor: true,
        admin: true,
        helpers: req.handlebars.helpers,
        config: req.app.config
    });
});

// insert new brand form action
router.post('/admin/brand/insert', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

    let doc = {
        brandPermalink: req.body.frmBrandPermalink,
        brandTitle: common.cleanHtml(req.body.frmBrandTitle),
        brandAddedDate: new Date()
    };

    db.brands.count({'brandPermalink': req.body.frmBrandPermalink}, (err, brand) => {
        if(err){
            console.info(err.stack);
        }
        if(brand > 0 && req.body.frmBrandPermalink !== ''){
            // permalink exits
            req.session.message = 'Permalink already exists. Pick a new one.';
            req.session.messageType = 'danger';

            // keep the current stuff
            req.session.brandTitle = req.body.frmBrandTitle;
            req.session.brandDescription = req.body.frmBrandDescription;

            // redirect to insert
            res.redirect('/admin/brand/new');
        }else{
            db.brands.insert(doc, (err, newDoc) => {
                if(err){
                    console.log(colors.red('Error inserting document: ' + err));

                    // keep the current stuff
                    req.session.brandTitle = req.body.frmBrandTitle;
                    req.session.brandDescription = req.body.frmBrandDescription;

                    req.session.message = 'Error: Inserting brand';
                    req.session.messageType = 'danger';

                    // redirect to insert
                    res.redirect('/admin/brand/new');
                }else{
                    // get the new ID
                    let newId = newDoc.insertedIds[0];

                    // add to lunr index
                    common.indexBrands(req.app)
                    .then(() => {
                        req.session.message = 'New brand successfully created';
                        req.session.messageType = 'success';

                        // redirect to new doc
                        res.redirect('/admin/brand/edit/' + newId);
                    });
                }
            });
        }
    });
});

// render the editor
router.get('/admin/brand/edit/:id', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

      db.brands.findOne({_id: common.getId(req.params.id)}, (err, result) => {
          if(err){
              console.info(err.stack);
          }

          res.render('brand_edit', {
              title: 'Edit Brand',
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

// Update an existing brand form action
router.post('/admin/brand/update', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

    db.brands.findOne({_id: common.getId(req.body.frmBrandId)}, (err, brand) => {
        if(err){
            console.info(err.stack);
            req.session.message = 'Failed updating brand.';
            req.session.messageType = 'danger';
            res.redirect('/admin/brand/edit/' + req.body.frmBrandId);
            return;
        }
        db.brands.count({'brandPermalink': req.body.frmBrandPermalink, _id: {$ne: common.getId(brand._id)}}, (err, count) => {
            if(err){
                console.info(err.stack);
                req.session.message = 'Failed updating brand.';
                req.session.messageType = 'danger';
                res.redirect('/admin/brand/edit/' + req.body.frmBrandId);
                return;
            }

            if(count > 0 && req.body.frmBrandPermalink !== ''){
                // permalink exits
                req.session.message = 'Permalink already exists. Pick a new one.';
                req.session.messageType = 'danger';

                // keep the current stuff
                req.session.brandTitle = req.body.frmBrandTitle;
                req.session.brandDescription = req.body.frmBrandDescription;

                // redirect to insert
                res.redirect('/admin/brand/edit/' + req.body.frmBrandId);
            }else{
                  let brandDoc = {
                      brandTitle: common.cleanHtml(req.body.frmBrandTitle),
                      brandPermalink: req.body.frmBrandPermalink
                  };

                  db.brands.update({_id: common.getId(req.body.frmBrandId)}, {$set: brandDoc}, {}, (err, numReplaced) => {
                      if(err){
                          console.error(colors.red('Failed to save brand: ' + err));
                          req.session.message = 'Failed to save. Please try again';
                          req.session.messageType = 'danger';
                          res.redirect('/admin/brand/edit/' + req.body.frmBrandId);
                      }else{
                          // Update the index
                          common.indexBrands(req.app)
                          .then(() => {
                              req.session.message = 'Successfully saved';
                              req.session.messageType = 'success';
                              res.redirect('/admin/brand/edit/' + req.body.frmBrandId);
                          });
                      }
                  });
            }
        });
    });
});

// delete brand
router.get('/admin/brand/delete/:id', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

    // remove the article
    db.brands.remove({_id: common.getId(req.params.id)}, {}, (err, numRemoved) => {
        if(err){
            console.info(err.stack);
        }
        // remove the index
        common.indexBrands(req.app)
        .then(() => {
            // redirect home
            req.session.message = 'Brand successfully deleted';
            req.session.messageType = 'success';
            res.redirect('/admin/brands');
        });
    });
});

module.exports = router;
