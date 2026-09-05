-- Uttarakhand hackathon demonstration seed.
-- Covers every Uttarakhand village seeded by 003_add_village_cluster_data.sql.
-- UUIDs make repeated runs safe; village IDs are resolved by name because the
-- historical cluster migration generated those village UUIDs at insert time.
-- Apply migration 004 before running this file.

INSERT INTO businesses (id, name, business_type, location, village_id) VALUES
  ('50000000-0000-0000-0000-000000000001', 'Himalayan Fresh Mart', 'fresh_produce_retailer', ST_SetSRID(ST_MakePoint(78.1508, 30.2608), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Clement Town')),
  ('50000000-0000-0000-0000-000000000002', 'Doon Farm Equipment', 'agri_equipment_service', ST_SetSRID(ST_MakePoint(78.1479, 30.2589), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Clement Town')),
  ('50000000-0000-0000-0000-000000000003', 'Doiwala Dairy Collective', 'dairy_collection', ST_SetSRID(ST_MakePoint(78.2112, 30.1795), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Doiwala')),
  ('50000000-0000-0000-0000-000000000004', 'Doiwala Sugarcane Services', 'farm_service', ST_SetSRID(ST_MakePoint(78.2078, 30.1816), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Doiwala')),
  ('50000000-0000-0000-0000-000000000005', 'Yamuna Fish and Feed', 'aquaculture_supplier', ST_SetSRID(ST_MakePoint(78.0813, 30.3211), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Dakpathar')),
  ('50000000-0000-0000-0000-000000000006', 'Dakpathar Repair Hub', 'repair_service', ST_SetSRID(ST_MakePoint(78.0778, 30.3192), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Dakpathar')),
  ('50000000-0000-0000-0000-000000000007', 'Herbertpur Fruit Traders', 'fruit_wholesaler', ST_SetSRID(ST_MakePoint(78.0511, 30.2807), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Herbertpur')),
  ('50000000-0000-0000-0000-000000000008', 'Herbertpur Greenhouse Inputs', 'agri_input_retailer', ST_SetSRID(ST_MakePoint(78.0486, 30.2789), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Herbertpur')),
  ('50000000-0000-0000-0000-000000000009', 'Saharanpur Road Logistics Hub', 'transport_service', ST_SetSRID(ST_MakePoint(78.1812, 30.3495), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Saharanpur Road')),
  ('50000000-0000-0000-0000-000000000010', 'Saharanpur Road Grain Store', 'grain_wholesaler', ST_SetSRID(ST_MakePoint(78.1784, 30.3510), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Saharanpur Road')),
  ('50000000-0000-0000-0000-000000000011', 'Vasantpur Honey Collective', 'honey_cooperative', ST_SetSRID(ST_MakePoint(78.0212, 30.1507), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Vasantpur')),
  ('50000000-0000-0000-0000-000000000012', 'Vasantpur Women Weaving Centre', 'handicraft_cooperative', ST_SetSRID(ST_MakePoint(78.0187, 30.1491), 4326)::geography, (SELECT v.id FROM villages v JOIN districts d ON d.id = v.district_id JOIN states s ON s.id = d.state_id WHERE s.name = 'Uttarakhand' AND v.name = 'Vasantpur'))
ON CONFLICT (id) DO NOTHING;

INSERT INTO business_products (id, business_id, product_name, unit, price) VALUES
  ('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Seasonal vegetables', 'kg', 42.00),
  ('51000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Apple crate', 'crate', 820.00),
  ('51000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'Power tiller rental', 'day', 1650.00),
  ('51000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 'Water pump repair', 'service', 450.00),
  ('51000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', 'Milk procurement', 'litre', 42.00),
  ('51000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000003', 'Paneer', 'kg', 360.00),
  ('51000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000004', 'Sugarcane harvest labour', 'acre', 2900.00),
  ('51000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000004', 'Tractor transport', 'trip', 1250.00),
  ('51000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000005', 'Fish feed', '25 kg bag', 1320.00),
  ('51000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000005', 'Fingerlings', '100 fish', 520.00),
  ('51000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000006', 'Motor repair', 'service', 650.00),
  ('51000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000006', 'Mobile repair', 'service', 300.00),
  ('51000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000007', 'Apple grading', 'crate', 26.00),
  ('51000000-0000-0000-0000-000000000014', '50000000-0000-0000-0000-000000000007', 'Pear crate', 'crate', 690.00),
  ('51000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000008', 'Polyhouse sheet', 'square metre', 118.00),
  ('51000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000008', 'Organic compost', '50 kg bag', 760.00),
  ('51000000-0000-0000-0000-000000000017', '50000000-0000-0000-0000-000000000009', 'Produce transport', 'pickup trip', 1450.00),
  ('51000000-0000-0000-0000-000000000018', '50000000-0000-0000-0000-000000000009', 'Cold-chain booking', 'crate', 34.00),
  ('51000000-0000-0000-0000-000000000019', '50000000-0000-0000-0000-000000000010', 'Wheat flour', 'kg', 36.00),
  ('51000000-0000-0000-0000-000000000020', '50000000-0000-0000-0000-000000000010', 'Mustard oil', 'litre', 168.00),
  ('51000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000011', 'Raw honey', 'kg', 410.00),
  ('51000000-0000-0000-0000-000000000022', '50000000-0000-0000-0000-000000000011', 'Beeswax', 'kg', 520.00),
  ('51000000-0000-0000-0000-000000000023', '50000000-0000-0000-0000-000000000012', 'Handwoven stole', 'piece', 780.00),
  ('51000000-0000-0000-0000-000000000024', '50000000-0000-0000-0000-000000000012', 'Woollen basket', 'piece', 460.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO market_observations (id, location, observation_type, value, unit, source_label, observed_at) VALUES
  ('52000000-0000-0000-0000-000000000001', ST_SetSRID(ST_MakePoint(78.1506, 30.2604), 4326)::geography, 'vegetable_demand', 180.00, 'orders per week', 'Clement Town retail survey', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000002', ST_SetSRID(ST_MakePoint(78.1485, 30.2593), 4326)::geography, 'tiller_rental_rate', 1650.00, 'day', 'Doon Farm Equipment', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000003', ST_SetSRID(ST_MakePoint(78.1520, 30.2615), 4326)::geography, 'apple_crate_price', 820.00, 'crate', 'Clement Town market board', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000004', ST_SetSRID(ST_MakePoint(78.2108, 30.1803), 4326)::geography, 'milk_procurement_price', 42.00, 'litre', 'Doiwala Dairy Collective', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000005', ST_SetSRID(ST_MakePoint(78.2084, 30.1810), 4326)::geography, 'sugarcane_harvest_cost', 2900.00, 'acre', 'Doiwala farm survey', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000006', ST_SetSRID(ST_MakePoint(78.2123, 30.1791), 4326)::geography, 'dairy_collection_volume', 1250.00, 'litres per day', 'Doiwala Dairy Collective', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000007', ST_SetSRID(ST_MakePoint(78.0807, 30.3207), 4326)::geography, 'fish_feed_price', 1320.00, '25 kg bag', 'Yamuna Fish and Feed', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000008', ST_SetSRID(ST_MakePoint(78.0784, 30.3194), 4326)::geography, 'repair_service_demand', 64.00, 'requests per week', 'Dakpathar Repair Hub', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000009', ST_SetSRID(ST_MakePoint(78.0820, 30.3217), 4326)::geography, 'fish_market_volume', 340.00, 'kg per week', 'Dakpathar market survey', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000010', ST_SetSRID(ST_MakePoint(78.0507, 30.2805), 4326)::geography, 'apple_grading_rate', 26.00, 'crate', 'Herbertpur Fruit Traders', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000011', ST_SetSRID(ST_MakePoint(78.0490, 30.2792), 4326)::geography, 'polyhouse_sheet_price', 118.00, 'square metre', 'Herbertpur input survey', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000012', ST_SetSRID(ST_MakePoint(78.0520, 30.2813), 4326)::geography, 'fruit_collection_volume', 490.00, 'crates per day', 'Herbertpur Fruit Traders', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000013', ST_SetSRID(ST_MakePoint(78.1806, 30.3497), 4326)::geography, 'transport_rate', 1450.00, 'pickup trip', 'Saharanpur Road Logistics Hub', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000014', ST_SetSRID(ST_MakePoint(78.1788, 30.3508), 4326)::geography, 'wheat_flour_price', 36.00, 'kg', 'Saharanpur Road Grain Store', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000015', ST_SetSRID(ST_MakePoint(78.1817, 30.3511), 4326)::geography, 'cold_chain_demand', 92.00, 'crates per week', 'Saharanpur Road Logistics Hub', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000016', ST_SetSRID(ST_MakePoint(78.0208, 30.1505), 4326)::geography, 'raw_honey_price', 410.00, 'kg', 'Vasantpur Honey Collective', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000017', ST_SetSRID(ST_MakePoint(78.0191, 30.1494), 4326)::geography, 'handwoven_stole_price', 780.00, 'piece', 'Vasantpur Women Weaving Centre', CURRENT_TIMESTAMP),
  ('52000000-0000-0000-0000-000000000018', ST_SetSRID(ST_MakePoint(78.0218, 30.1513), 4326)::geography, 'honey_collection_volume', 260.00, 'kg per month', 'Vasantpur Honey Collective', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO local_risks (id, risk_type, description, severity, location) VALUES
  ('53000000-0000-0000-0000-000000000001', 'rainfall_disruption', 'Heavy rainfall can delay fresh produce deliveries.', 'medium', ST_SetSRID(ST_MakePoint(78.1492, 30.2598), 4326)::geography),
  ('53000000-0000-0000-0000-000000000002', 'input_price_volatility', 'Farm equipment and input prices vary during the planting season.', 'medium', ST_SetSRID(ST_MakePoint(78.1475, 30.2585), 4326)::geography),
  ('53000000-0000-0000-0000-000000000003', 'fodder_shortage', 'Dry-season fodder availability can affect dairy margins.', 'high', ST_SetSRID(ST_MakePoint(78.2102, 30.1797), 4326)::geography),
  ('53000000-0000-0000-0000-000000000004', 'flooded_access_road', 'Farm access roads can become difficult during intense rainfall.', 'high', ST_SetSRID(ST_MakePoint(78.2073, 30.1819), 4326)::geography),
  ('53000000-0000-0000-0000-000000000005', 'feed_supply_delay', 'Fish feed deliveries may be delayed during monsoon periods.', 'medium', ST_SetSRID(ST_MakePoint(78.0810, 30.3214), 4326)::geography),
  ('53000000-0000-0000-0000-000000000006', 'river_level_change', 'Rapid river-level changes can affect aquaculture activity.', 'high', ST_SetSRID(ST_MakePoint(78.0780, 30.3190), 4326)::geography),
  ('53000000-0000-0000-0000-000000000007', 'fruit_spoilage', 'Delayed collection can increase fruit spoilage losses.', 'high', ST_SetSRID(ST_MakePoint(78.0503, 30.2802), 4326)::geography),
  ('53000000-0000-0000-0000-000000000008', 'polyhouse_damage', 'Strong winds can damage uncovered polyhouse structures.', 'medium', ST_SetSRID(ST_MakePoint(78.0482, 30.2786), 4326)::geography),
  ('53000000-0000-0000-0000-000000000009', 'transport_bottleneck', 'Peak-season collection can exceed available pickup capacity.', 'high', ST_SetSRID(ST_MakePoint(78.1808, 30.3492), 4326)::geography),
  ('53000000-0000-0000-0000-000000000010', 'grain_price_volatility', 'Wholesale grain prices vary across weekly market days.', 'medium', ST_SetSRID(ST_MakePoint(78.1781, 30.3505), 4326)::geography),
  ('53000000-0000-0000-0000-000000000011', 'bee_colony_loss', 'Pesticide exposure can reduce bee colony health.', 'high', ST_SetSRID(ST_MakePoint(78.0205, 30.1502), 4326)::geography),
  ('53000000-0000-0000-0000-000000000012', 'seasonal_tourism_demand', 'Handicraft demand declines outside visitor seasons.', 'medium', ST_SetSRID(ST_MakePoint(78.0184, 30.1488), 4326)::geography)
ON CONFLICT (id) DO NOTHING;

INSERT INTO distribution_channels (id, name, channel_type, location) VALUES
  ('54000000-0000-0000-0000-000000000001', 'Clement Town Fresh Produce Collection Point', 'collection_centre', ST_SetSRID(ST_MakePoint(78.1515, 30.2602), 4326)::geography),
  ('54000000-0000-0000-0000-000000000002', 'Clement Town Retail Delivery Route', 'last_mile_delivery', ST_SetSRID(ST_MakePoint(78.1480, 30.2595), 4326)::geography),
  ('54000000-0000-0000-0000-000000000003', 'Doiwala Dairy Chilling Route', 'cold_chain_route', ST_SetSRID(ST_MakePoint(78.2118, 30.1808), 4326)::geography),
  ('54000000-0000-0000-0000-000000000004', 'Doiwala Farm Produce Collection Point', 'collection_centre', ST_SetSRID(ST_MakePoint(78.2072, 30.1804), 4326)::geography),
  ('54000000-0000-0000-0000-000000000005', 'Dakpathar Fish Distribution Link', 'transport_route', ST_SetSRID(ST_MakePoint(78.0818, 30.3202), 4326)::geography),
  ('54000000-0000-0000-0000-000000000006', 'Dakpathar Local Service Market', 'local_market', ST_SetSRID(ST_MakePoint(78.0785, 30.3216), 4326)::geography),
  ('54000000-0000-0000-0000-000000000007', 'Herbertpur Fruit Collection Hub', 'collection_centre', ST_SetSRID(ST_MakePoint(78.0517, 30.2801), 4326)::geography),
  ('54000000-0000-0000-0000-000000000008', 'Herbertpur Horticulture Wholesale Link', 'wholesale_market', ST_SetSRID(ST_MakePoint(78.0481, 30.2795), 4326)::geography),
  ('54000000-0000-0000-0000-000000000009', 'Saharanpur Road Cold Storage Link', 'cold_chain_route', ST_SetSRID(ST_MakePoint(78.1818, 30.3502), 4326)::geography),
  ('54000000-0000-0000-0000-000000000010', 'Saharanpur Road Wholesale Route', 'transport_route', ST_SetSRID(ST_MakePoint(78.1780, 30.3498), 4326)::geography),
  ('54000000-0000-0000-0000-000000000011', 'Vasantpur Honey Collection Point', 'collection_centre', ST_SetSRID(ST_MakePoint(78.0215, 30.1501), 4326)::geography),
  ('54000000-0000-0000-0000-000000000012', 'Vasantpur Handicraft Marketplace', 'digital_marketplace', ST_SetSRID(ST_MakePoint(78.0189, 30.1498), 4326)::geography)
ON CONFLICT (id) DO NOTHING;
