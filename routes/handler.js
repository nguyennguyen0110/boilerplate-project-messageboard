'use strict';
// Import bcrypt to hash password, mongoose for MongoDB
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Create schema
const threadsSchema = new mongoose.Schema({
  board: {type: String, required: true},
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: {type: String, required: true},
  replies: [
    {
      text: String,
      created_on: Date,
      delete_password: {type: String, required: true},
      reported: Boolean
    }
  ]
});

// Create model
const Threads = mongoose.model('Threads', threadsSchema);


// *** Handler start here ***

// POST threads - create new thread in a board
exports.threads_post = function(req, res) {
  let newThread = new Threads({
    board: req.params.board,
    text: req.body.text,
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: bcrypt.hashSync(req.body.delete_password, 12),
    replies: []
  });
  newThread.save((err, doc) => {
    if (err) return console.log(err);
    res.redirect(`/b/${req.params.board}/`);
  });
};

// GET threads - get 10 most recent bump threads with 3 most recent replies each thread from a paticular board
// Use Model.aggregate() to $slice and exclude fields in the second $project state (can not use both in Model.find())
exports.threads_get = function(req, res) {
  Threads.aggregate([
    {$match: {board: req.params.board}},
    {$sort : {bumped_on : -1}},
    {$limit: 10},
    {$project: {text: 1, created_on: 1, bumped_on: 1, replies: {$slice: ["$replies", -3]}}},
    {$project: {"replies.reported": 0, "replies.delete_password": 0}}
  ])
  .exec((err, doc) => {
    if (err) return console.log(err);
    res.json(doc);
  });
};

// DELETE threads - compare password then remove thread if correct
exports.threads_delete = function(req, res) {
  Threads.findById(req.body.thread_id, (err, doc) => {
    if (err) return console.log(err);
    if (bcrypt.compareSync(req.body.delete_password, doc.delete_password)) {
      Threads.findByIdAndRemove(req.body.thread_id, (err, doc) => {
        if (err) return console.log(err);
        res.json('success');
      });
    }
    else {
      res.json('incorrect password');
    }
  });
};

// PUT threads - report thread by find it and update field 'reported'
exports.threads_put = function(req, res) {
  Threads.findByIdAndUpdate(req.body.thread_id, {reported: true}, (err, doc) => {
    if (err) return console.log(err);
    res.json('success');
  });
};

// POST replies - create new reply in a thread
exports.replies_post = function(req, res) {
  let newReply = {
    text: req.body.text,
    created_on: new Date(),
    delete_password: bcrypt.hashSync(req.body.delete_password, 12),
    reported: false
  };
  Threads.findByIdAndUpdate(req.body.thread_id, {bumped_on: new Date(), $push: {replies: newReply}}, (err, doc) => {
    if (err) return console.log(err);
    res.redirect(`/b/${req.params.board}/${req.body.thread_id}`);
  });
};

// GET replies - get a thread with all its replies
exports.replies_get = function(req, res) {
  Threads.findById(req.query.thread_id)
    .select('-board -reported -delete_password -replies.reported -replies.delete_password')
    .exec((err, doc) => {
      if (err) return console.log(err);
      res.json(doc);
    });
};

//DELETE replies - change the text of reply to [deleted] if correct password
exports.replies_delete = function(req, res) {
  Threads.findById(req.body.thread_id, (err, doc) => {
    if (err) return console.log(err);
    for (let reply of doc.replies) {
      if (reply.id == req.body.reply_id) {
        if (bcrypt.compareSync(req.body.delete_password, reply.delete_password)) {
          reply.text = '[deleted]';
          doc.save((err, data) => {
            if (err) return console.log(err);
            res.json('success');
          });
          break;
        }
        else {
          res.json('incorrect password');
          break;
        }
      }
    }
  });
};

// PUT replies - report reply by find it and update field 'reported'
exports.replies_put = function(req, res) {
  Threads.findById(req.body.thread_id, (err, doc) => {
    if (err) return console.log(err);
    for (let reply of doc.replies) {
      if (reply.id == req.body.reply_id) {
        reply.reported = true;
      }
    }
    doc.save((err, data) => {
      if (err) return console.log(err);
      res.json('success');
    });
  });
};
