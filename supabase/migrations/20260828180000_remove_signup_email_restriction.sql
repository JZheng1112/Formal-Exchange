-- Remove the trigger on auth.users that restricts signup to only ox.ac.uk / cam.ac.uk emails.
-- Anyone should be able to register; only formal ticket LISTING requires verified Oxbridge email.

drop trigger if exists enforce_oxbridge_email_domain_before_signup on auth.users;
drop function if exists enforce_oxbridge_email_domain() cascade;
