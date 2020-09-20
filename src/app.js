require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')

const app = express()

const { NODE_ENV } = require('./config');

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

const BookmarksService = require('./bookmarks-service')

app.get('/bookmarks', (req, res, next) => {
  const knexInstance = req.app.get('db')
  BookmarksService.getAllBookmarks(knexInstance)
  .then(bookmarks => {
      res.json(bookmarks)
  })
  .catch(next)
})

app.get('/bookmarks/:bookmarks_id', (req, res, next) => {
  const knexInstance = req.app.get('db')
  BookmarksService.getById(knexInstance, req.params.bookmarks_id)
  .then(bookmark => {
      res.json(bookmark)
  })
  .catch(next)
})

app.use((error, req, res, next) => {
  let response;

  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' }}
  } else {
    response = { error }
  }

  res.status(500).json(response);
});  

module.exports = app;