# E-LIBRARY

A static GitHub Pages library application built with HTML, CSS, JavaScript, and Supabase.

## Project structure

- `index.html` — home page
- `catalog.html` — catalog page with search and filters
- `book.html` — book details page
- `login.html` — login page
- `register.html` — member registration page
- `member.html` — private member dashboard
- `admin.html` — private admin dashboard
- `css/style.css` — branding and layout styles
- `js/*.js` — Supabase and app logic
- `supabase/*.sql` — database schema, seed data, and storage policies

## Configuration

1. Create a Supabase project.
2. Open `js/supabase-config.js`.
3. Replace:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Run the SQL files in `supabase/schema.sql`, then `supabase/seed.sql`.
5. Run `supabase/storage.sql` if you want to store book cover assets in Supabase Storage.

## Supabase setup notes

- Use the publishable anon key only in the frontend.
- Do not expose service role or database secret values.
- Admin roles must be assigned from a trusted Supabase Auth account and then recorded in the `admins` table through a secure admin process.

## Deployment

Deploy the repository to GitHub Pages. All page navigation uses static HTML paths and is compatible with a repository subpath deployment like:

https://USERNAME.github.io/REPOSITORY/

## Local static testing

You can preview the site by opening the HTML files directly in a local browser or by using a basic static file server, for example:

python -m http.server 8000

Then visit:

http://localhost:8000
