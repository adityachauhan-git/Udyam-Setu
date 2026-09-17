-- Focused Clement Town transport feasibility demonstration seed.
-- Apply migration 004 and the base Uttarakhand seed before running this file.
-- Fixed UUIDs make repeated runs safe.

INSERT INTO businesses (id, name, business_type, location, village_id) VALUES
  ('55000000-0000-0000-0000-000000000001', 'Clement Town Rural Transport Cooperative', 'transport_service', ST_SetSRID(ST_MakePoint(78.1509, 30.2607), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Clement Town')),
  ('55000000-0000-0000-0000-000000000002', 'Doon Harvest Logistics', 'transport_logistics', ST_SetSRID(ST_MakePoint(78.1478, 30.2587), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Clement Town')),
  ('55000000-0000-0000-0000-000000000003', 'Himalayan Last-Mile Delivery', 'transport_service', ST_SetSRID(ST_MakePoint(78.1531, 30.2618), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Clement Town')),
  ('55000000-0000-0000-0000-000000000004', 'Clement Town Cold-Chain Couriers', 'transport_service', ST_SetSRID(ST_MakePoint(78.1459, 30.2579), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Clement Town'))
ON CONFLICT (id) DO NOTHING;

INSERT INTO business_products (id, business_id, product_name, unit, price) VALUES
  ('56000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000001', 'Farm produce pickup', 'trip', 900.00),
  ('56000000-0000-0000-0000-000000000002', '55000000-0000-0000-0000-000000000001', 'Shared mini-truck rental', 'day', 2200.00),
  ('56000000-0000-0000-0000-000000000003', '55000000-0000-0000-0000-000000000002', 'Produce delivery to Dehradun', 'trip', 1450.00),
  ('56000000-0000-0000-0000-000000000004', '55000000-0000-0000-0000-000000000002', 'Warehouse-to-market haulage', 'trip', 1850.00),
  ('56000000-0000-0000-0000-000000000005', '55000000-0000-0000-0000-000000000003', 'Parcel delivery', 'parcel', 80.00),
  ('56000000-0000-0000-0000-000000000006', '55000000-0000-0000-0000-000000000003', 'Same-day local delivery', 'trip', 350.00),
  ('56000000-0000-0000-0000-000000000007', '55000000-0000-0000-0000-000000000004', 'Chilled produce transport', 'crate', 65.00),
  ('56000000-0000-0000-0000-000000000008', '55000000-0000-0000-0000-000000000004', 'Milk and dairy route', 'trip', 1250.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO market_observations (id, location, observation_type, value, unit, source_label, observed_at) VALUES
  ('57000000-0000-0000-0000-000000000001', ST_SetSRID(ST_MakePoint(78.1507, 30.2605), 4326)::geography, 'farm_transport_demand', 118.00, 'trips per week', 'Clement Town transport survey', CURRENT_TIMESTAMP),
  ('57000000-0000-0000-0000-000000000002', ST_SetSRID(ST_MakePoint(78.1482, 30.2590), 4326)::geography, 'parcel_delivery_demand', 210.00, 'parcels per week', 'Doon delivery survey', CURRENT_TIMESTAMP),
  ('57000000-0000-0000-0000-000000000003', ST_SetSRID(ST_MakePoint(78.1524, 30.2613), 4326)::geography, 'average_local_delivery_rate', 350.00, 'per trip', 'Clement Town delivery operators', CURRENT_TIMESTAMP),
  ('57000000-0000-0000-0000-000000000004', ST_SetSRID(ST_MakePoint(78.1464, 30.2582), 4326)::geography, 'produce_haulage_rate', 1450.00, 'per trip', 'Doon Harvest Logistics', CURRENT_TIMESTAMP),
  ('57000000-0000-0000-0000-000000000005', ST_SetSRID(ST_MakePoint(78.1495, 30.2599), 4326)::geography, 'cold_chain_demand', 74.00, 'crates per week', 'Clement Town cold-chain survey', CURRENT_TIMESTAMP),
  ('57000000-0000-0000-0000-000000000006', ST_SetSRID(ST_MakePoint(78.1518, 30.2609), 4326)::geography, 'vehicle_utilisation', 68.00, 'percent of available trips', 'Clement Town transport cooperative', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO local_risks (id, risk_type, description, severity, location) VALUES
  ('58000000-0000-0000-0000-000000000001', 'fuel_price_volatility', 'Fuel price changes can reduce margins on fixed-rate delivery routes.', 'high', ST_SetSRID(ST_MakePoint(78.1498, 30.2597), 4326)::geography),
  ('58000000-0000-0000-0000-000000000002', 'monsoon_route_disruption', 'Heavy rainfall can delay farm pickup and last-mile delivery routes.', 'high', ST_SetSRID(ST_MakePoint(78.1472, 30.2584), 4326)::geography),
  ('58000000-0000-0000-0000-000000000003', 'vehicle_maintenance_cost', 'Frequent rural-road use can increase repair and maintenance costs.', 'medium', ST_SetSRID(ST_MakePoint(78.1526, 30.2616), 4326)::geography),
  ('58000000-0000-0000-0000-000000000004', 'seasonal_demand_variation', 'Transport demand may vary with harvest cycles and market days.', 'medium', ST_SetSRID(ST_MakePoint(78.1458, 30.2577), 4326)::geography)
ON CONFLICT (id) DO NOTHING;

INSERT INTO distribution_channels (id, name, channel_type, location) VALUES
  ('59000000-0000-0000-0000-000000000001', 'Clement Town Farm Pickup Route', 'collection_route', ST_SetSRID(ST_MakePoint(78.1510, 30.2609), 4326)::geography),
  ('59000000-0000-0000-0000-000000000002', 'Doon Market Delivery Route', 'last_mile_delivery', ST_SetSRID(ST_MakePoint(78.1483, 30.2588), 4326)::geography),
  ('59000000-0000-0000-0000-000000000003', 'Clement Town Parcel Dispatch Point', 'parcel_network', ST_SetSRID(ST_MakePoint(78.1528, 30.2610), 4326)::geography),
  ('59000000-0000-0000-0000-000000000004', 'Dehradun Wholesale Transport Link', 'wholesale_route', ST_SetSRID(ST_MakePoint(78.1462, 30.2580), 4326)::geography),
  ('59000000-0000-0000-0000-000000000005', 'Clement Town Cold-Chain Loading Point', 'cold_chain_route', ST_SetSRID(ST_MakePoint(78.1501, 30.2594), 4326)::geography)
ON CONFLICT (id) DO NOTHING;
