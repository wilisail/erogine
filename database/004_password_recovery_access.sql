-- Match the existing private-schema server role. It can consume reset links,
-- while only the database operator can insert or delete reset records.
GRANT SELECT, UPDATE ON erogine.auth_password_resets TO erogine_app;
CREATE POLICY erogine_server_only ON erogine.auth_password_resets
  TO erogine_app USING (true) WITH CHECK (true);
