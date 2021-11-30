const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(5000);
  const board = 'asd';
  let test_thread_id = '';
  let test_reply_id = '';
  test('1 - Creating a new thread: POST request', done => {
    chai.request(server)
      .post(`/api/threads/${board}`)
      .send({text: 'Test thread', delete_password: 'asd'})
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });
  test('2 - Viewing the 10 most recent threads with 3 replies each: GET request', done => {
    chai.request(server)
      .get(`/api/threads/${board}`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isAtMost(res.body.length, 10);
        assert.property(res.body[0], '_id');
        test_thread_id = res.body[0]._id
        assert.property(res.body[0], 'created_on');
        assert.property(res.body[0], 'bumped_on');
        assert.equal(res.body[0].text, 'Test thread');
        assert.isArray(res.body[0].replies);
        assert.equal(res.body[0].replies.length, 0);
        assert.notProperty(res.body[0], 'reported');
        assert.notProperty(res.body[0], 'delete_password');
        for (let obj of res.body) {
          assert.isAtMost(obj.replies.length, 3);
          if (obj.replies.length >= 1) {
            for (let reply of obj.replies) {
              assert.property(reply, 'created_on');
              assert.property(reply, 'text');
              assert.notProperty(reply, 'reported');
              assert.notProperty(reply, 'delete_password');
            }
          }
        }
        done();
      });
  });
  test('3 - Reporting a thread: PUT request', done => {
    chai.request(server)
      .put(`/api/threads/${board}`)
      .send({thread_id: test_thread_id})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body, 'success');
        done();
      });
  });
  test('4 - Creating a new reply: POST request', done => {
    chai.request(server)
      .post(`/api/replies/${board}`)
      .send({text: 'Test reply', delete_password: 'asd', thread_id: test_thread_id})
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });
  test('5 - Viewing a single thread with all replies: GET request', done => {
    chai.request(server)
      .get(`/api/replies/${board}?thread_id=${test_thread_id}`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, '_id');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'bumped_on');
        assert.equal(res.body.text, 'Test thread');
        assert.notProperty(res.body, 'reported');
        assert.notProperty(res.body, 'delete_password');
        assert.isArray(res.body.replies);
        assert.equal(res.body.replies.length, 1);
        assert.property(res.body.replies[0], 'created_on');
        assert.property(res.body.replies[0], '_id');
        test_reply_id = res.body.replies[0]._id;
        assert.notProperty(res.body.replies[0], 'reported');
        assert.notProperty(res.body.replies[0], 'delete_password');
        assert.equal(res.body.replies[0].text, 'Test reply');
        done();
      });
  });
  test('6 - Reporting a reply: PUT request', done => {
    chai.request(server)
      .put(`/api/replies/${board}`)
      .send({thread_id: test_thread_id, reply_id: test_reply_id})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body, 'success');
        done();
      });
  });
  test('7 - Deleting a thread with the incorrect password: DELETE request', done => {
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send({thread_id: test_thread_id, delete_password: 'abc'})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body, 'incorrect password');
        done();
      });
  });
  test('8 - Deleting a reply with the incorrect password: DELETE request', done => {
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send({thread_id: test_thread_id, reply_id: test_reply_id, delete_password: 'abc'})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body, 'incorrect password');
        done();
      });
  });
  test('9 - Deleting a reply: DELETE request', done => {
    chai.request(server)
      .delete(`/api/replies/${board}`)
      .send({thread_id: test_thread_id, reply_id: test_reply_id, delete_password: 'asd'})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body, 'success');
        done();
      });
  });
  test('10 - Check reply text after deleted', done => {
    chai.request(server)
      .get(`/api/replies/${board}?thread_id=${test_thread_id}`)
      .end((err, res) => {
        assert.equal(res.body.replies[0].text, '[deleted]');
        done();
      });
  });
  test('11 - Deleting a thread: DELETE request', done => {
    chai.request(server)
      .delete(`/api/threads/${board}`)
      .send({thread_id: test_thread_id, delete_password: 'asd'})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body, 'success');
        done();
      });
  });
  test('12 - Check thread after deleted', done => {
    chai.request(server)
      .get(`/api/replies/${board}?thread_id=${test_thread_id}`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body, null);
        done();
      });
  });
});
