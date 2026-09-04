-- Demonstration GIS data. Fixed UUIDs make this seed safely repeatable.
-- Coordinates are intentionally near multiple seeded village clusters so
-- radius-based PostGIS queries discover shared records without village copies.

INSERT INTO businesses (id, name, business_type, location, village_id) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Hinjewadi Farm Inputs', 'agri_input_retailer', ST_SetSRID(ST_MakePoint(73.7410, 18.5925), 4326)::geography, '30000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'Talegaon Dairy Collection', 'dairy_collection', ST_SetSRID(ST_MakePoint(73.7270, 18.6160), 4326)::geography, '30000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', 'Sinnar Agri Equipment', 'equipment_service', ST_SetSRID(ST_MakePoint(74.0020, 19.8460), 4326)::geography, '30000000-0000-0000-0000-000000000003'),
  ('40000000-0000-0000-0000-000000000004', 'Devanahalli Digital Service Centre', 'digital_service', ST_SetSRID(ST_MakePoint(77.7110, 13.2485), 4326)::geography, '30000000-0000-0000-0000-000000000004'),
  ('40000000-0000-0000-0000-000000000005', 'Nanjangud Spice Market', 'market', ST_SetSRID(ST_MakePoint(76.6845, 12.1180), 4326)::geography, '30000000-0000-0000-0000-000000000005'),
  ('40000000-0000-0000-0000-000000000006', 'Dehradun Orchard Collective', 'horticulture_cooperative', ST_SetSRID(ST_MakePoint(78.1515, 30.2590), 4326)::geography, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO business_products (id, business_id, product_name, unit, price) VALUES
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Organic fertiliser', '50 kg bag', 720.00),
  ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Paddy seed', 'kg', 68.00),
  ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Fresh milk procurement', 'litre', 39.50),
  ('41000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000003', 'Power tiller rental', 'day', 1450.00),
  ('41000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000004', 'Digital document service', 'application', 35.00),
  ('41000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000005', 'Turmeric', 'kg', 138.00),
  ('41000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000006', 'Apple grading service', 'crate', 24.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO market_observations (id, location, observation_type, value, unit, source_label, observed_at) VALUES
  ('42000000-0000-0000-0000-000000000001', ST_SetSRID(ST_MakePoint(73.7400, 18.5918), 4326)::geography, 'fertiliser_price', 720.00, '50 kg bag', 'Hinjewadi Farm Inputs', CURRENT_TIMESTAMP),
  ('42000000-0000-0000-0000-000000000002', ST_SetSRID(ST_MakePoint(74.0010, 19.8470), 4326)::geography, 'milk_procurement_price', 39.50, 'litre', 'Sinnar dairy market survey', CURRENT_TIMESTAMP),
  ('42000000-0000-0000-0000-000000000003', ST_SetSRID(ST_MakePoint(77.7120, 13.2490), 4326)::geography, 'digital_service_demand', 86.00, 'requests per week', 'Devanahalli service centre', CURRENT_TIMESTAMP),
  ('42000000-0000-0000-0000-000000000004', ST_SetSRID(ST_MakePoint(76.6850, 12.1175), 4326)::geography, 'turmeric_price', 138.00, 'kg', 'Nanjangud Spice Market', CURRENT_TIMESTAMP),
  ('42000000-0000-0000-0000-000000000005', ST_SetSRID(ST_MakePoint(78.1505, 30.2605), 4326)::geography, 'apple_grading_volume', 340.00, 'crates per day', 'Dehradun Orchard Collective', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO local_risks (id, risk_type, description, severity, location) VALUES
  ('43000000-0000-0000-0000-000000000001', 'input_supply_delay', 'Seasonal delivery delays for farm inputs have been observed.', 'medium', ST_SetSRID(ST_MakePoint(73.7360, 18.5900), 4326)::geography),
  ('43000000-0000-0000-0000-000000000002', 'water_shortage', 'Irrigation availability can be constrained before monsoon rainfall.', 'high', ST_SetSRID(ST_MakePoint(74.0050, 19.8430), 4326)::geography),
  ('43000000-0000-0000-0000-000000000003', 'market_price_volatility', 'Spice prices vary materially across weekly market days.', 'medium', ST_SetSRID(ST_MakePoint(76.6820, 12.1160), 4326)::geography),
  ('43000000-0000-0000-0000-000000000004', 'weather_disruption', 'Heavy rainfall can disrupt orchard transport and collection.', 'high', ST_SetSRID(ST_MakePoint(78.1490, 30.2610), 4326)::geography)
ON CONFLICT (id) DO NOTHING;

INSERT INTO distribution_channels (id, name, channel_type, location) VALUES
  ('44000000-0000-0000-0000-000000000001', 'Pune Farm Produce Collection Point', 'collection_centre', ST_SetSRID(ST_MakePoint(73.7450, 18.6000), 4326)::geography),
  ('44000000-0000-0000-0000-000000000002', 'Nashik Dairy Transport Route', 'transport_route', ST_SetSRID(ST_MakePoint(74.0150, 19.8550), 4326)::geography),
  ('44000000-0000-0000-0000-000000000003', 'Bengaluru Rural Digital Marketplace', 'digital_marketplace', ST_SetSRID(ST_MakePoint(77.7200, 13.2500), 4326)::geography),
  ('44000000-0000-0000-0000-000000000004', 'Mysuru Spice Wholesale Link', 'wholesale_market', ST_SetSRID(ST_MakePoint(76.6900, 12.1200), 4326)::geography),
  ('44000000-0000-0000-0000-000000000005', 'Dehradun Fruit Collection Hub', 'collection_centre', ST_SetSRID(ST_MakePoint(78.1550, 30.2580), 4326)::geography)
ON CONFLICT (id) DO NOTHING;
