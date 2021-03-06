const express = require('express')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const jsonParser = express.json()

const path = require('path')
const xss = require('xss')

const xssCleanUpBookmark = (bookmark) => {
    const cleanedUpBookmark = { 
        "id": bookmark.id,
        "title": xss(bookmark.title),
        "url": xss(bookmark.url),
        "rating": bookmark.rating,
        "description": xss(bookmark.description)
    }
    
    return cleanedUpBookmark;
}

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(
        req.app.get('db')
        )
        .then(bookmarks => {
            const cleanedUpBookmarks = bookmarks.map(bookmark => {
                return xssCleanUpBookmark(bookmark)
            })

            res.json(cleanedUpBookmarks)
        })
        .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { id, title, url, rating, description } = req.body
        const newBookmarkRequiredItems = { id, title, url, rating }
        const newBookmarkUnrequiredItems = { description }
        const requiredAsNumbers = { rating }

        // loop through keys and values of passed in values to check the required items are there
        for (const [key, value] of Object.entries(newBookmarkRequiredItems)) {
                if (value == null) {
                    return res.status(400).json({
                        error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        // loop through items required as numbers to check they are numbers
        for (const [key, value] of Object.entries(requiredAsNumbers)) {
            if (isNaN(Number(value))) {
                return res.status(400).json({
                    error: { message: `'${key}' should be a number but is not` }
                })
            }
        }

        if (rating < 0 || rating > 5) {
            return res.status(400).json({
                error: { message: `Rating cannot be greater than 5 or less than 0` }
            })
        }
        
        const newBookmark = { ...newBookmarkRequiredItems, ...newBookmarkUnrequiredItems}
        
        const cleanedUpBookmark = xssCleanUpBookmark(newBookmark)
        
        BookmarksService.insertBookmark(    
            req.app.get('db'),
            cleanedUpBookmark
        )
        .then(bookmark => {
            
        res
            .status(201)
            .location(path.posix.join(req.originalUrl,`/${bookmark.id}`))
            .json(bookmark)
        })
        .catch(next)
    })

bookmarksRouter
    .route('/:bookmark_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, req.params.bookmark_id)

        .then(bookmark => {
            if (!bookmark) {
                return res.status(404).json({
                    error: { message: `Bookmark doesn't exist` }
                })
        }
            res.bookmark = bookmark // save the bookmark for the next middleware
            next() // called next so the next middleware happens!
        })
        .catch(next)
    })
    .get((req, res, next) => {
       
        const cleanedUpBookmark = xssCleanUpBookmark(res.bookmark)

        res.json({
            ...cleanedUpBookmark
        })
    })
    .patch(jsonParser, (req, res, next) => {
        const { title, url, rating, description } = req.body
        const bookmarkToUpdate = { title, url, rating, description }
        const bookmarkRequiredItems = { title, url, rating }

        const numberOfValues = Object.values(bookmarkRequiredItems).filter(Boolean).length
        
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain at least one of 'title', 'url', or 'rating'`
                }
            })
        }

        res.status(204).end()
        
        BookmarksService.updateBookmark(
            req.app.get('db'),
            req.params.bookmark_id,
            bookmarkToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id
        )
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })

module.exports = bookmarksRouter