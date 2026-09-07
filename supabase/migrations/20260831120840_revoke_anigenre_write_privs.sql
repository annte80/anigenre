/*
# Revoke write privileges from anon/authenticated on Anigenre tables

The RLS policies already block writes (no INSERT/UPDATE/DELETE policies exist),
but the underlying table grants still allow anon and authenticated to attempt
write operations. Revoke those grants so only the service role (which bypasses
RLS and is used exclusively by the admin edge function) can modify data.

1. Security changes
- REVOKE INSERT, UPDATE, DELETE on anigenre_entities and anigenre_config from anon and authenticated.
- GRANT SELECT only, keeping public read access intact.
*/

REVOKE INSERT, UPDATE, DELETE ON anigenre_entities FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON anigenre_config FROM anon, authenticated;
GRANT SELECT ON anigenre_entities TO anon, authenticated;
GRANT SELECT ON anigenre_config TO anon, authenticated;
