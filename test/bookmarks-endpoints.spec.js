const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')

const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', () => {
    let db
  
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe(`GET /bookmarks`, () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert test bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks)
            })
        })
    })

    describe(`GET /bookmarks/:id`, () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 200 and the specified article', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(200, expectedBookmark)
            })
        })
    })

    describe(`POST /bookmarks`, () => {
      it(`creates a bookmark, responding with 201 and the new bookmark`,  function() {
        const newBookmark = {
            id: 6,
            title: 'Google',
            url: 'https://www.google.com',
            rating: 5,
            description: 'Fun in the sun'
        }

        return supertest(app)
          .post('/bookmark')
          .send(newBookmark)
          .expect(201)
          .expect(res => {
            expect(res.body.id).to.eql(newBookmark.id)
            expect(res.body.title).to.eql(newBookmark.title)
            expect(res.body.url).to.eql(newBookmark.url)
            expect(res.body.rating).to.eql(newBookmark.rating)
            expect(res.body.description).to.eql(newBookmark.description)
            expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
            expect(res.body).to.have.property('id')
          })
          .then(postRes =>
            supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        )
      })
    })
})