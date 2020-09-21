
const BookmarksService = {
    getAllBookmarks(knex) {
        return knex.select('*').from('bookmarks')
    },
    insertBookmark(knex, newBookmark) {
        return knex
        .insert(newBookmark)
        .into('bookmarks')
        .returning('*') //built in knex method to return all of the item that was just inserted
        .then(rows => {
            return rows[0] // pull object out of array that is returned
        })
    },
    getById(knex, id) {
        return knex.from('bookmarks').select('*').where('id', id).first()
    },
    // updateBookmark(knex, id, newBookmarkFields) {
    //     return knex('bookmarks')
    //     .where({ id })
    //     .update(newBookmarkFields)
    // },
    // deleteBookmark(knex, id) {
    //     return knex('bookmarks')
    //     .where({ id })
    //     .delete()
    // }
}

module.exports = BookmarksService