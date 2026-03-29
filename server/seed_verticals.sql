-- Seed data for the new verticals.
-- Paste/run this in Supabase SQL editor.

-- ══ ACTIVITIES SEED ══
INSERT INTO activities (title, location, city, description, price, price_type, duration, max_group, min_age, category, tags, gradient, included, meeting_point, featured, is_active) VALUES
('Quad Biking in the Palmeraie',   'Palmeraie, Marrakech', 'Marrakech', 'Race through palm groves and desert terrain on powerful quad bikes. Suitable for beginners and experienced riders alike.', 45, 'per_person', '2 hours', 12, 16, 'Adventure', ARRAY['Desert','Outdoor','Thrill'], 'linear-gradient(145deg,#c8a06e,#8B5E3C,#2C1F12)', ARRAY['Helmet & safety gear','Guide','Water'], 'Hotel pickup available', true, true),
('Marrakech Medina Food Walk',      'Jemaa el-Fna, Marrakech', 'Marrakech', 'Taste your way through the ancient medina with a local foodie guide. From msemen to pastilla — experience the real flavours of Morocco.', 55, 'per_person', '3 hours', 8, 0, 'Food', ARRAY['Food','Culture','Local'], 'linear-gradient(145deg,#C0654A,#8B3A2A,#1A1410)', ARRAY['All tastings','Guide','Water'], 'Café de France, Jemaa el-Fna', true, true),
('Surf Lessons in Essaouira',       'Essaouira Beach', 'Essaouira', 'Catch your first wave on the Atlantic coast. Essaouira''s consistent winds make it Morocco''s top surf destination.', 70, 'per_person', 'Half day', 6, 10, 'Sport', ARRAY['Surf','Beach','Sport'], 'linear-gradient(145deg,#6B8CAE,#3D5A73,#1A2C38)', ARRAY['Board & wetsuit','Instructor','Photos'], 'Essaouira Surf School', false, true),
('Atlas Mountains Day Hike',        'Imlil, Marrakech', 'Marrakech', 'Trek through Berber villages and terraced fields with a certified mountain guide. Stunning views of Toubkal summit.', 85, 'per_person', 'Full day', 10, 12, 'Nature', ARRAY['Hiking','Mountains','Nature'], 'linear-gradient(145deg,#7A8C6E,#4A5C3E,#2C3828)', ARRAY['Guide','Lunch','Transport from Marrakech'], 'Imlil village square', true, true),
('Traditional Hammam Experience',   'Marrakech Medina', 'Marrakech', 'Surrender to the ancient ritual of the Moroccan hammam. Scrub, steam, and emerge renewed in a centuries-old bathhouse.', 40, 'per_person', '2 hours', 4, 0, 'Relaxation', ARRAY['Wellness','Culture','Spa'], 'linear-gradient(145deg,#D4A853,#C0654A,#1A1410)', ARRAY['Towels','Kessa glove','Argan soap','Tea'], 'Riad reception', false, true),
('Fès Medina Photography Tour',     'Fès el-Bali', 'Fès', 'Discover the world''s largest car-free urban area through your lens. A local photographer guides you to the most iconic spots.', 65, 'per_person', '4 hours', 6, 0, 'Photography', ARRAY['Photography','Culture','History'], 'linear-gradient(145deg,#8B9E8A,#5C7A6E,#2A3C35)', ARRAY['Guide','Photo tips','Tea in a riad'], 'Bab Bou Jeloud gate', false, true);

-- ══ ACCOMMODATIONS SEED ══
INSERT INTO accommodations (name, type, location, city, description, price_from, price_to, stars, tags, amenities, gradient, phone, featured, is_active) VALUES
('Riad Yasmine',        'Riad',       'Derb Sidi Ahmed Ou Moussa, Marrakech', 'Marrakech', 'Famous for its iconic swimming pool and lush courtyard garden. A sanctuary of calm in the heart of the medina.', 120, 280, 5, ARRAY['Luxury','Pool','Medina'], ARRAY['Pool','WiFi','Breakfast','AC','Rooftop'], 'linear-gradient(145deg,#D4A853,#C0654A,#1A1410)', '+212 524 387 295', true, true),
('El Fenn',             'Riad',       'Mouassine, Marrakech Medina', 'Marrakech', 'Owned by Vanessa Branson, El Fenn is one of Marrakech''s most celebrated design riads. Curated art, rooftop pools, and exceptional cuisine.', 250, 600, 5, ARRAY['Luxury','Design','Art'], ARRAY['Pool','WiFi','Restaurant','Bar','Spa','Rooftop'], 'linear-gradient(145deg,#C0654A,#8B3A2A,#1A1410)', '+212 524 441 210', true, true),
('Hotel Palais Amani',  'Hotel',      'Fès el-Bali, Fès', 'Fès', 'A restored 19th-century palace overlooking the medina. Authentic Moroccan architecture with all modern comforts.', 180, 400, 5, ARRAY['Historic','Palace','Luxury'], ARRAY['Pool','WiFi','Restaurant','Spa','Hammam','Parking'], 'linear-gradient(145deg,#7A8C6E,#4A5C3E,#2C3828)', '+212 535 741 229', true, true),
('Dar Anika',           'Riad',       'Arset El Maach, Marrakech', 'Marrakech', 'Authentic 16th-century architecture meets contemporary comfort. Seven rooms arranged around a flowering courtyard.', 90, 160, 4, ARRAY['Authentic','Boutique','Medina'], ARRAY['WiFi','Breakfast','Rooftop','AC'], 'linear-gradient(145deg,#8B9E8A,#5C7A6E,#2A3C35)', '+212 524 376 114', false, true),
('Villa Mabrouka',      'Villa',      'Tangier',  'Tangier', 'Yves Saint Laurent''s legendary Tangier retreat. Six elegant suites with views of the Strait of Gibraltar.', 400, 900, 5, ARRAY['Luxury','Historic','Sea view'], ARRAY['Pool','WiFi','Garden','Chef','Sea view'], 'linear-gradient(145deg,#6B8CAE,#3D5A73,#1A2C38)', '+212 539 333 351', true, true),
('Kasbah Tamadot',      'Guesthouse', 'Asni, Atlas Mountains', 'Marrakech', 'Richard Branson''s Moroccan retreat perched in the High Atlas. Berber tents, mountain views, and total escape from the world.', 350, 800, 5, ARRAY['Mountain','Luxury','Retreat'], ARRAY['Pool','Spa','Restaurant','WiFi','Mountains'], 'linear-gradient(145deg,#c8a06e,#8B5E3C,#2C1F12)', '+212 524 368 200', false, true);

-- ══ RESTAURANTS SEED ══
INSERT INTO restaurants (name, cuisine, location, city, description, price_range, tags, gradient, phone, has_terrace, reservations, is_active, featured) VALUES
('Nomad',              'Contemporary Moroccan', 'Derb Aajane, Marrakech', 'Marrakech', 'Iconic rooftop restaurant redefining Moroccan cuisine with creative modern dishes. Unmissable views of the medina skyline.', '€€€', ARRAY['Rooftop','Trendy','Views'], 'linear-gradient(145deg,#C0654A,#8B3A2A,#1A1410)', '+212 524 381 609', true, true, true, true),
('Le Jardin',          'Moroccan Garden',       'Mouassine, Marrakech', 'Marrakech', 'Hidden garden restaurant in the heart of the medina. Dine under orange trees with birdsong for company.', '€€€', ARRAY['Garden','Romantic','Medina'], 'linear-gradient(145deg,#7A8C6E,#4A5C3E,#2C3828)', '+212 524 378 295', true, true, true, true),
('Clock Cafe Fes',     'International',         'Talaa Kebira, Fès', 'Fès', 'Community hub serving creative food, camel burgers, and cultural events. A meeting point for travellers and locals.', '€€', ARRAY['Casual','Cultural','Rooftop'], 'linear-gradient(145deg,#D4A853,#C0654A,#1A1410)', '+212 535 637 855', true, false, true, false),
('La Sqala',           'Traditional Moroccan',  'Boulevard des Almohades, Casablanca', 'Casablanca', 'A romantic fortress restaurant serving classic Moroccan cuisine in a lush courtyard garden. A Casablanca institution.', '€€€', ARRAY['Traditional','Garden','Historic'], 'linear-gradient(145deg,#8B9E8A,#5C7A6E,#2A3C35)', '+212 522 260 960', true, true, true, false),
('Côté Plage',         'Seafood',               'Essaouira Beach', 'Essaouira', 'Barefoot dining on the Atlantic. Fresh catch of the day, grilled fish, and sea views you''ll never forget.', '€€', ARRAY['Seafood','Beach','Casual'], 'linear-gradient(145deg,#6B8CAE,#3D5A73,#1A2C38)', '+212 524 476 000', true, false, true, true),
('Dar Moha',           'Traditional Moroccan',  'Rue Dar el Bacha, Marrakech', 'Marrakech', 'Chef Moha Fedal brings haute Moroccan cuisine to an exquisite riad setting. Among the best tables in the country.', '€€€€', ARRAY['Fine Dining','Luxury','Riad'], 'linear-gradient(145deg,#c8a06e,#8B5E3C,#2C1F12)', '+212 524 386 400', true, true, true, true);

-- ══ PACKAGES SEED ══
INSERT INTO packages (title, subtitle, duration_days, cities, price_from, max_group, difficulty, description, highlights, included, not_included, itinerary, tags, gradient, featured, is_active) VALUES
('Imperial Cities Explorer', 'Fès · Meknès · Rabat · Marrakech', 8, ARRAY['Marrakech','Fès','Meknès','Rabat'], 1240, 16, 'easy',
 'Trace the footsteps of Moroccan dynasties through four imperial capitals. Ancient medinas, royal palaces, and centuries of history.',
 ARRAY['UNESCO Fès el-Bali medina','Royal Palace of Meknès','Hassan Tower Rabat','Marrakech souks'],
 ARRAY['7 nights accommodation (riads/hotels)','Daily breakfast','Private transport','English-French guide','Airport transfers'],
 ARRAY['Flights','Lunches & dinners','Personal expenses'],
 $$[
  {"day":1,"title":"Arrival in Casablanca","activities":["Airport transfer","Check in Casablanca"]},
  {"day":2,"title":"Rabat — Capital City","activities":["Hassan Tower","Kasbah des Oudaias","Mausoleum of Mohammed V"]},
  {"day":3,"title":"Meknès & Volubilis","activities":["Roman ruins of Volubilis","Bab Mansour gate","Moulay Ismail Mausoleum"]},
  {"day":4,"title":"Fès — Ancient Medina","activities":["Bou Inania madrasa","Chouara tanneries","Nejjarine Museum"]},
  {"day":5,"title":"Fès Free Day","activities":["Medina exploration","Cooking class (optional)","Hammam"]},
  {"day":6,"title":"Journey to Marrakech","activities":["Scenic mountain drive","Lunch in Azrou","Arrive Marrakech"]},
  {"day":7,"title":"Marrakech","activities":["Jemaa el-Fna","Majorelle Garden","Saadian Tombs","Souks"]},
  {"day":8,"title":"Departure","activities":["Final breakfast","Airport transfer"]}
 ]$$::jsonb,
 ARRAY['History','Culture','Cities','Imperial'],
 'linear-gradient(145deg,#C0654A,#8B3A2A,#1A1410)', true, true),

('Sahara to Atlantic', 'Desert · Oases · Coast', 10, ARRAY['Marrakech','Merzouga','Zagora','Essaouira'], 1580, 12, 'moderate',
 'The ultimate Moroccan contrast: sleep under a billion stars in the Sahara, then wake to Atlantic waves. A journey through the soul of Morocco.',
 ARRAY['Camel trek to desert camp','Overnight in luxury desert camp','Draa Valley palmeraie','Essaouira Atlantic coast'],
 ARRAY['9 nights accommodation','Daily breakfast','Private 4x4 transport','Expert guide','Airport transfers','Camel trek','Desert camp'],
 ARRAY['Flights','Most meals','Personal expenses'],
 $$[
  {"day":1,"title":"Marrakech Arrival","activities":["Welcome dinner","Riad check-in"]},
  {"day":2,"title":"Over the Atlas","activities":["Tizi n-Tichka pass","Ait Benhaddou kasbah","Arrive Ouarzazate"]},
  {"day":3,"title":"Draa Valley","activities":["Zagora palmery","Draa river walk","Desert camp transfer"]},
  {"day":4,"title":"Sahara","activities":["Sunrise camel trek","Erg Chebbi dunes","Berber music night"]},
  {"day":5,"title":"Desert to Oases","activities":["4x4 piste drive","Ziz Valley","Todra Gorge"]},
  {"day":6,"title":"Dadès & Roses","activities":["Dadès gorge","Valley of Roses","Traditional riad"]},
  {"day":7,"title":"Marrakech","activities":["High Atlas return","Rest day","Hammam"]},
  {"day":8,"title":"To the Atlantic","activities":["Drive to Essaouira","Old port","Ramparts walk"]},
  {"day":9,"title":"Essaouira","activities":["Wind surfers beach","Fish market lunch","Free afternoon"]},
  {"day":10,"title":"Departure","activities":["Return to Marrakech","Departure transfer"]}
 ]$$::jsonb,
 ARRAY['Adventure','Desert','Coastal','Nature'],
 'linear-gradient(145deg,#c8a06e,#8B5E3C,#2C1F12)', true, true),

('Morocco Family Adventure', 'Kid-friendly · Safe · Fun', 7, ARRAY['Marrakech','Atlas','Essaouira'], 890, 20, 'easy',
 'Designed for families: camel rides, cooking classes, beach days, and medina treasure hunts that kids actually love.',
 ARRAY['Family camel ride','Moroccan cooking class','Essaouira beach','Medina treasure hunt'],
 ARRAY['6 nights family rooms','Breakfast daily','Private transport','Family guide','Activities'],
 ARRAY['Flights','Lunches & dinners'],
 $$[
  {"day":1,"title":"Marrakech Arrival","activities":["Hotel check-in","Jemaa el-Fna evening"]},
  {"day":2,"title":"Marrakech","activities":["Medina treasure hunt","Souks shopping","Rooftop dinner"]},
  {"day":3,"title":"Atlas Day Trip","activities":["Berber village visit","Camel ride","Waterfall picnic"]},
  {"day":4,"title":"Cooking & Hammam","activities":["Kids cooking class","Traditional hammam","Free afternoon"]},
  {"day":5,"title":"Drive to Essaouira","activities":["Scenic coastal drive","Beach arrival"]},
  {"day":6,"title":"Essaouira","activities":["Beach day","Ramparts walk","Seafood dinner"]},
  {"day":7,"title":"Departure","activities":["Return to Marrakech","Airport transfer"]}
 ]$$::jsonb,
 ARRAY['Family','Kids','Easy','Cultural'],
 'linear-gradient(145deg,#7A8C6E,#4A5C3E,#2C3828)', false, true);

