insert into public.books (book_id, title, author, category, description, cover_url, stock, availability_status)
values
  (gen_random_uuid(), 'The Design of Everyday Things', 'Don Norman', 'Technology', 'A foundational look at human-centred design and usability.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80', 8, 'available'),
  (gen_random_uuid(), 'Clean Code', 'Robert C. Martin', 'Programming', 'A practical guide to readable, sustainable software design.', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80', 5, 'available'),
  (gen_random_uuid(), 'Data Science for Business', 'Foster Provost', 'Data Science', 'A readable introduction to data-driven thinking in organizations.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80', 3, 'available'),
  (gen_random_uuid(), 'Digital Signal Processing', 'John G. Proakis', 'Engineering', 'A classic overview of signal analysis and processing principles.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80', 2, 'borrowed'),
  (gen_random_uuid(), 'Introduction to Algorithms', 'Thomas H. Cormen', 'Computer Science', 'A comprehensive reference for algorithm design and analysis.', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80', 4, 'available'),
  (gen_random_uuid(), 'The Psychology of Learning', 'B. F. Skinner', 'Education', 'A classic treatment of learning behavior and educational methods.', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80', 0, 'unavailable'),
  (gen_random_uuid(), 'Sustainable Innovation', 'Maya Rahman', 'Research', 'A strategic look at innovation with a sustainability lens.', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80', 6, 'available'),
  (gen_random_uuid(), 'Modern Physics', 'Serway & Jewett', 'Physics', 'A structured overview of classical and modern physics principles.', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80', 1, 'available')
on conflict do nothing;

-- Create admin access only after registering an authenticated admin user in Supabase Auth.
-- Example:
-- insert into public.profiles (user_id, name, email, user_type, institutional_id)
-- values ('<auth-user-id>', 'FST Library Admin', 'admin@fst.ac.id', 'admin', 'ADM-001');
-- insert into public.admins (admin_id, name)
-- values ('<auth-user-id>', 'FST Library Admin');
