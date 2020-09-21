const express = require('express')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const jsonParser = express.json()

bookmarksRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(
        req.app.get('db')
        )
        .then(bookmarks => {
            res.json(bookmarks)
        })
        .catch(next)
})

bookmarksRouter
    .route('/bookmark')
    .post(jsonParser, (req, res, next) => {
        const { id, title, url, rating, description } = req.body
        const newBookmark = { id, title, url, rating, description }

        BookmarksService.insertBookmark(    
            req.app.get('db'),
            newBookmark
        )
        .then(bookmark => {
        res
            .status(201)
            .location(`/bookmarks/${bookmark.id}`)
            .json(bookmark)
        })
        .catch(next)
})

bookmarksRouter
    .route('/:bookmark_id')
    .get((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'), 
            req.params.bookmarks_id
        )
        .then(bookmark => {
            if (!bookmark) {
                return res.status(404).json({
                    error: { message: `Bookmark doesn't exist` }
                })
            }
            res.json(bookmark)
        })
        .catch(next)
})

module.exports = bookmarksRouter