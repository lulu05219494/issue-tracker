'use strict';

const crypto = require('crypto');

// In-memory storage: { projectName: [issue, ...] }
const projects = {};

const UPDATABLE_FIELDS = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];

function getIssues(project) {
  if (!projects[project]) projects[project] = [];
  return projects[project];
}

function newId() {
  return crypto.randomBytes(12).toString('hex');
}

// Form fields arrive as strings; 'open' must be a boolean
function toBoolean(value) {
  return value === true || value === 'true';
}

module.exports = function (app) {

  app.route('/api/issues/:project')

    .get(function (req, res){
      let project = req.params.project;
      const filters = req.query;

      const result = getIssues(project).filter(issue =>
        Object.keys(filters).every(key => String(issue[key]) === String(filters[key]))
      );
      res.json(result);
    })

    .post(function (req, res){
      let project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const now = new Date();
      const issue = {
        _id: newId(),
        issue_title,
        issue_text,
        created_on: now,
        updated_on: now,
        created_by,
        assigned_to: assigned_to || '',
        open: true,
        status_text: status_text || ''
      };
      getIssues(project).push(issue);
      res.json(issue);
    })

    .put(function (req, res){
      let project = req.params.project;
      const { _id } = req.body;

      if (!_id) return res.json({ error: 'missing _id' });

      // Empty form fields count as "not sent"
      const updates = {};
      UPDATABLE_FIELDS.forEach(field => {
        const value = req.body[field];
        if (value !== undefined && value !== '') {
          updates[field] = field === 'open' ? toBoolean(value) : value;
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }

      const issue = getIssues(project).find(i => i._id === _id);
      if (!issue) return res.json({ error: 'could not update', '_id': _id });

      Object.assign(issue, updates);
      // Make sure updated_on is always later than created_on
      const now = new Date();
      issue.updated_on = now > issue.created_on ? now : new Date(issue.created_on.getTime() + 1);
      res.json({ result: 'successfully updated', '_id': _id });
    })

    .delete(function (req, res){
      let project = req.params.project;
      const { _id } = req.body;

      if (!_id) return res.json({ error: 'missing _id' });

      const issues = getIssues(project);
      const index = issues.findIndex(i => i._id === _id);
      if (index === -1) return res.json({ error: 'could not delete', '_id': _id });

      issues.splice(index, 1);
      res.json({ result: 'successfully deleted', '_id': _id });
    });

};
