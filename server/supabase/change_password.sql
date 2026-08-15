-- Run this SQL in your Supabase SQL Editor to update the password for rajarajan
UPDATE auth.users 
SET encrypted_password = crypt('Rajarajan@pc@takshashila@1', gen_salt('bf'))
WHERE email = 'rajarajan2994@gmail.com';
