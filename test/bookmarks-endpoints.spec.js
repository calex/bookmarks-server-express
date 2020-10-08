const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')

const { makeBookmarksArray } = require('./bookmarks.fixtures')

// const removeObjectItem = (originalObject, removedProp) => {
//   Object.keys(originalObject).reduce((object, key) => {
//       if (key !== removedProp) {
//         object[key] = originalObject[key]
//       }

//       return object;
//   })
// }

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

    const testBookmarks = makeBookmarksArray()

    const maliciousBookmarkPost = {
      id: 911,
      title: 'Naughty naughty very naughty <script>alert("xss");</script>',
      url: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
      rating: 5,
      description: "<script>document.querySelector('.make-request').addEventListener('click', e => {fetch('http://localhost:8000/bookmarks/911').then(res => res.json()).then(body => {document.querySelector('.content').innerHTML = body.content})})</script>"
    }

    const cleanedUpFormerlyMaliciousPost = {
      id: 911,
      title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
      url: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
      rating: 5,
      description: "&lt;script&gt;document.querySelector('.make-request').addEventListener('click', e =&gt; {fetch('http://localhost:8000/bookmarks/911').then(res =&gt; res.json()).then(body =&gt; {document.querySelector('.content').innerHTML = body.content})})&lt;/script&gt;"
    }

    describe(`GET /bookmarks`, () => {
        context('Given there are bookmarks in the database', () => {

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

        context(`Given an XSS attack bookmark within served bookmarks in database`, () => {
  
          const testBookmarksWithMaliciousBookmark = {...testBookmarks, maliciousBookmarkPost};

          beforeEach('insert malicious bookmark', () => {
            return db
              .into('bookmarks')
              .insert(Object.values(testBookmarksWithMaliciousBookmark))
            })
            
            it('removes XSS attack content', () => {
        
              return supertest(app)
                .get(`/bookmarks`)
                .expect(200)
                .expect(res => {
                    expect(res.body[res.body.length - 1].title).to.eql(cleanedUpFormerlyMaliciousPost.title)
                    expect(res.body[res.body.length - 1].url).to.eql(cleanedUpFormerlyMaliciousPost.url)
                    expect(res.body[res.body.length - 1].description).to.eql(cleanedUpFormerlyMaliciousPost.description)
                })
            })
        })
    })

    describe(`GET /bookmarks/:id`, () => {
        context('Given there are bookmarks in the database', () => {

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(200, expectedBookmark)
            })
        })

        context(`Given an XSS attack bookmark`, () => {
  
          beforeEach('insert malicious bookmark', () => {
            return db
              .into('bookmarks')
              .insert([ maliciousBookmarkPost ])
            })
            
            it('removes XSS attack content', () => {
        
              return supertest(app)
                .get(`/bookmarks/${maliciousBookmarkPost.id}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.title).to.eql(cleanedUpFormerlyMaliciousPost.title)
                    expect(res.body.url).to.eql(cleanedUpFormerlyMaliciousPost.url)
                    expect(res.body.description).to.eql(cleanedUpFormerlyMaliciousPost.description)
                })
            })
        })
    })

    describe(`POST /bookmarks`, () => {

      const newBookmark = {
          id: 6,
          title: 'Google',
          url: 'https://www.google.com',
          rating: 5,
          description: 'Fun in the sun'
      }

      it(`returns a cleaned up bookmark, given an XSS attack content post`,  function() {
        return supertest(app)
          .post('/bookmarks')
          .send(maliciousBookmarkPost)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(cleanedUpFormerlyMaliciousPost.title)
            expect(res.body.url).to.eql(cleanedUpFormerlyMaliciousPost.url)
            expect(res.body.description).to.eql(cleanedUpFormerlyMaliciousPost.description)
          })
          .then(postRes =>
            supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        )
      })
    
      it(`creates a bookmark, responding with 201 and the new bookmark`,  function() {
        return supertest(app)
          .post('/bookmarks')
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

      it(`responds with 400 and an error message when an item that needs to be convertable to a number is not one`, () => {
        newBookmark['rating'] = 'Eleventy'

        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `'rating' should be a number but is not` }
        })
      })

      it(`responds with 400 and an error message when a rating is too high or low`, () => {
        newBookmark['rating'] = 6

        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `Rating cannot be greater than 5 or less than 0` }
        })
      })

      it(`responds with 400 and an error message when a required item is missing from a post`, () => {
          delete newBookmark['title']

          return supertest(app)
            .post('/bookmarks')
            .send(newBookmark)
            .expect(400, {
              error: { message: `Missing 'title' in request body` }
          })
      })
    })

    describe(`DELETE /bookmarks/:bookmark_id`, () => {
      context('Given there are bookmarks in the database', () => {    
        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks')
            .insert(testBookmarks)
        })
      
        it('responds with 204 and removes the bookmark', () => {
          const idToRemove = 2
          const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
          
          return supertest(app)
            .delete(`/bookmarks/${idToRemove}`)
            .expect(204)
              .then(res =>
                supertest(app)
                  .get(`/bookmarks`)
                  .expect(expectedBookmarks)
                )
        })
      })

      context(`Given no bookmarks corresponding to item requested for deletion`, () => {
        it(`responds with 404`, () => {
          const bookmarkId = 123456
          return supertest(app)
            .delete(`/bookmarks/${bookmarkId}`)
            .expect(404, { error: { message: `Bookmark doesn't exist` } 
          })
        })
      })

    })
})