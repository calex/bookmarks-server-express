NOTE: In the case of this project, seed Postgres database using: `psql -U dunder_mifflin -d bookmarks -f ./seeds/seed.bookmarks.sql `

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Deploying

When your new project is ready for deployment, add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and you can then `npm run deploy` which will push to this remote's master branch.
