CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY NOT NULL UNIQUE, 
    title TEXT NOT NULL, 
    url TEXT NOT NULL UNIQUE, 
    rating INTEGER NOT NULL, 
    description TEXT 
);
