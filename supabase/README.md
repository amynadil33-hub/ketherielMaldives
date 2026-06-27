# Supabase Setup

1. Open the Supabase SQL editor for the project.
2. Run `schema.sql`.
3. Run `seed.sql`.
4. Restart the React frontend so it reads `frontend/.env.local`.

The frontend uses:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_PUBLISHABLE_KEY`

The publishable key is safe for browser reads, but it cannot create tables or run SQL. Use the SQL editor, Supabase CLI with database credentials, or a service-role/database connection string for schema changes.
