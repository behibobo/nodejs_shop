const express = require('express');
const common = require('../lib/common');
const colors = require('colors');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/admin/categories', common.restrict, (req, res, next) => {
    const db = req.app.db;
    // get the top results
    db.categories.find({}).sort({'categoryAddedDate': -1}).toArray((err, topResults) => {
        if(err){
            console.info(err.stack);
        }
        res.render('categories', {
            title: 'Categorys',
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

router.get('/admin/category/filter/:search', (req, res, next) => {
    const db = req.app.db;
    let searchTerm = req.params.search;
    let categoriesIndex = req.app.categoriesIndex;
    let lunrIdArray = [];
    categoriesIndex.search(searchTerm).forEach((id) => {
        lunrIdArray.push(common.getId(id.ref));
    });
    console.log(lunrIdArray);
    // we search on the lunr indexes
    db.categories.find({_id: {$in: lunrIdArray}}).toArray((err, results) => {
        if(err){
            console.error(colors.red('Error searching', err));
        }
        res.render('categories', {
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
router.get('/admin/category/new', common.restrict, common.checkAccess, (req, res) => {
    res.render('category_new', {
        title: 'New category',
        session: req.session,
        categoryTitle: common.clearSessionValue(req.session, 'categoryTitle'),
        categoryPermalink: common.clearSessionValue(req.session, 'categoryPermalink'),
        message: common.clearSessionValue(req.session, 'message'),
        messageType: common.clearSessionValue(req.session, 'messageType'),
        editor: true,
        admin: true,
        helpers: req.handlebars.helpers,
        config: req.app.config
    });
});

// insert new category form action
router.post('/admin/category/insert', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

    let doc = {
        categoryPermalink: req.body.frmCategoryPermalink,
        categoryTitle: common.cleanHtml(req.body.frmCategoryTitle),
        categoryAddedDate: new Date()
    };

    db.categories.count({'categoryPermalink': req.body.frmCategoryPermalink}, (err, category) => {
        if(err){
            console.info(err.stack);
        }
        if(category > 0 && req.body.frmCategoryPermalink !== ''){
            // permalink exits
            req.session.message = 'Permalink already exists. Pick a new one.';
            req.session.messageType = 'danger';

            // keep the current stuff
            req.session.categoryTitle = req.body.frmCategoryTitle;
            req.session.categoryDescription = req.body.frmCategoryDescription;

            // redirect to insert
            res.redirect('/admin/category/new');
        }else{
            db.categories.insert(doc, (err, newDoc) => {
                if(err){
                    console.log(colors.red('Error inserting document: ' + err));

                    // keep the current stuff
                    req.session.categoryTitle = req.body.frmCategoryTitle;
                    req.session.categoryDescription = req.body.frmCategoryDescription;

                    req.session.message = 'Error: Inserting category';
                    req.session.messageType = 'danger';

                    // redirect to insert
                    res.redirect('/admin/category/new');
                }else{
                    // get the new ID
                    let newId = newDoc.insertedIds[0];

                    // add to lunr index
                    common.indexCategories(req.app)
                    .then(() => {
                        req.session.message = 'New category successfully created';
                        req.session.messageType = 'success';

                        // redirect to new doc
                        res.redirect('/admin/category/edit/' + newId);
                    });
                }
            });
        }
    });
});

// render the editor
router.get('/admin/category/edit/:id', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

      db.categories.findOne({_id: common.getId(req.params.id)}, (err, result) => {
          if(err){
              console.info(err.stack);
          }

          res.render('category_edit', {
              title: 'Edit Category',
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

// Update an existing category form action
router.post('/admin/category/update', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

    db.categories.findOne({_id: common.getId(req.body.frmCategoryId)}, (err, category) => {
        if(err){
            console.info(err.stack);
            req.session.message = 'Failed updating category.';
            req.session.messageType = 'danger';
            res.redirect('/admin/category/edit/' + req.body.frmCategoryId);
            return;
        }
        db.categories.count({'categoryPermalink': req.body.frmCategoryPermalink, _id: {$ne: common.getId(category._id)}}, (err, count) => {
            if(err){
                console.info(err.stack);
                req.session.message = 'Failed updating category.';
                req.session.messageType = 'danger';
                res.redirect('/admin/category/edit/' + req.body.frmCategoryId);
                return;
            }

            if(count > 0 && req.body.frmCategoryPermalink !== ''){
                // permalink exits
                req.session.message = 'Permalink already exists. Pick a new one.';
                req.session.messageType = 'danger';

                // keep the current stuff
                req.session.categoryTitle = req.body.frmCategoryTitle;
                req.session.categoryDescription = req.body.frmCategoryDescription;

                // redirect to insert
                res.redirect('/admin/category/edit/' + req.body.frmCategoryId);
            }else{
                  let categoryDoc = {
                      categoryTitle: common.cleanHtml(req.body.frmCategoryTitle),
                      categoryPermalink: req.body.frmCategoryPermalink
                  };

                  db.categories.update({_id: common.getId(req.body.frmCategoryId)}, {$set: categoryDoc}, {}, (err, numReplaced) => {
                      if(err){
                          console.error(colors.red('Failed to save category: ' + err));
                          req.session.message = 'Failed to save. Please try again';
                          req.session.messageType = 'danger';
                          res.redirect('/admin/category/edit/' + req.body.frmCategoryId);
                      }else{
                          // Update the index
                          common.indexCategories(req.app)
                          .then(() => {
                              req.session.message = 'Successfully saved';
                              req.session.messageType = 'success';
                              res.redirect('/admin/category/edit/' + req.body.frmCategoryId);
                          });
                      }
                  });
            }
        });
    });
});

// delete category
router.get('/admin/category/delete/:id', common.restrict, common.checkAccess, (req, res) => {
    const db = req.app.db;

    // remove the article
    db.categories.remove({_id: common.getId(req.params.id)}, {}, (err, numRemoved) => {
        if(err){
            console.info(err.stack);
        }
        // remove the index
        common.indexCategories(req.app)
        .then(() => {
            // redirect home
            req.session.message = 'Category successfully deleted';
            req.session.messageType = 'success';
            res.redirect('/admin/categories');
        });
    });
});

module.exports = router;
