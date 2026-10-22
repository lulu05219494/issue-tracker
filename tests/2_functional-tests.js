const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const PROJECT = 'fcc-functional-tests';
const URL = '/api/issues/' + PROJECT;
const INVALID_ID = '5f665eb46e296f6b9b6a504d';

suite('Functional Tests', function() {
  this.timeout(5000);

  let issueId;       // created with every field
  let secondIssueId; // created with only required fields

  suite('POST /api/issues/{project}', function () {
    test('Create an issue with every field: POST request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .post(URL)
        .send({
          issue_title: 'Title',
          issue_text: 'Text',
          created_by: 'Tester',
          assigned_to: 'Assignee',
          status_text: 'In QA'
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Title');
          assert.equal(res.body.issue_text, 'Text');
          assert.equal(res.body.created_by, 'Tester');
          assert.equal(res.body.assigned_to, 'Assignee');
          assert.equal(res.body.status_text, 'In QA');
          assert.isTrue(res.body.open);
          assert.property(res.body, '_id');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'updated_on');
          issueId = res.body._id;
          done();
        });
    });

    test('Create an issue with only required fields: POST request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .post(URL)
        .send({
          issue_title: 'Required Title',
          issue_text: 'Required Text',
          created_by: 'Tester'
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Required Title');
          assert.equal(res.body.issue_text, 'Required Text');
          assert.equal(res.body.created_by, 'Tester');
          assert.equal(res.body.assigned_to, '');
          assert.equal(res.body.status_text, '');
          assert.isTrue(res.body.open);
          secondIssueId = res.body._id;
          done();
        });
    });

    test('Create an issue with missing required fields: POST request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .post(URL)
        .send({ issue_title: 'Only a title' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'required field(s) missing' });
          done();
        });
    });
  });

  suite('GET /api/issues/{project}', function () {
    test('View issues on a project: GET request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .get(URL)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtLeast(res.body.length, 2);
          res.body.forEach(issue => {
            assert.property(issue, '_id');
            assert.property(issue, 'issue_title');
            assert.property(issue, 'open');
          });
          done();
        });
    });

    test('View issues on a project with one filter: GET request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .get(URL)
        .query({ assigned_to: 'Assignee' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtLeast(res.body.length, 1);
          res.body.forEach(issue => assert.equal(issue.assigned_to, 'Assignee'));
          done();
        });
    });

    test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .get(URL)
        .query({ created_by: 'Tester', open: true })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtLeast(res.body.length, 2);
          res.body.forEach(issue => {
            assert.equal(issue.created_by, 'Tester');
            assert.isTrue(issue.open);
          });
          done();
        });
    });
  });

  suite('PUT /api/issues/{project}', function () {
    test('Update one field on an issue: PUT request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .put(URL)
        .send({ _id: issueId, issue_text: 'Updated Text' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', _id: issueId });
          done();
        });
    });

    test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .put(URL)
        .send({ _id: issueId, issue_title: 'Updated Title', open: false })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', _id: issueId });
          done();
        });
    });

    test('Update an issue with missing _id: PUT request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .put(URL)
        .send({ issue_text: 'No id' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });

    test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .put(URL)
        .send({ _id: issueId })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: issueId });
          done();
        });
    });

    test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .put(URL)
        .send({ _id: INVALID_ID, issue_text: 'Will not work' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not update', _id: INVALID_ID });
          done();
        });
    });
  });

  suite('DELETE /api/issues/{project}', function () {
    test('Delete an issue: DELETE request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .delete(URL)
        .send({ _id: secondIssueId })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully deleted', _id: secondIssueId });
          done();
        });
    });

    test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .delete(URL)
        .send({ _id: INVALID_ID })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not delete', _id: INVALID_ID });
          done();
        });
    });

    test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function (done) {
      chai.request(server)
        .keepOpen()
        .delete(URL)
        .send({})
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });
  });

});
