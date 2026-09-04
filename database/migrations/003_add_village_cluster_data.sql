-- ============================================================================
-- MIGRATION: Geographic Clustering - Add Nearby Villages & Shared Businesses
-- ============================================================================
-- This migration adds geographic clustering capabilities to villages
-- Includes: PostGIS-based nearest neighbor discovery and business ecosystem
-- Radius: 10km for business visibility across nearby villages

-- ============================================================================
-- SECTION 1: ADD COLUMNS TO VILLAGES TABLE
-- ============================================================================

ALTER TABLE villages
ADD COLUMN IF NOT EXISTS nearby_village_ids UUID[] DEFAULT '{}';

ALTER TABLE villages
ADD COLUMN IF NOT EXISTS shared_popular_businesses TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS villages_nearby_ids_idx ON villages USING GIN(nearby_village_ids);
CREATE INDEX IF NOT EXISTS villages_businesses_idx ON villages USING GIN(shared_popular_businesses);

-- ============================================================================
-- SECTION 2: INSERT STATES & DISTRICTS (UTTARAKHAND)
-- ============================================================================
-- Adding Uttarakhand state and Dehradun district for UK prototype

INSERT INTO states (id, name) VALUES
    ('10000000-0000-0000-0000-000000000003', 'Uttarakhand')
ON CONFLICT (id) DO NOTHING;

INSERT INTO districts (id, state_id, name) VALUES
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Dehradun')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 3: INSERT NEW VILLAGES IN 5 GEOGRAPHIC CLUSTERS
-- ============================================================================

-- CLUSTER 1: PUNE (Hinjewadi hub - 3 villages within 10km)
INSERT INTO villages (district_id, name, location) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Talegaon Dabhade', ST_SetSRID(ST_MakePoint(73.7250, 18.6150), 4326)::geography),
    ('20000000-0000-0000-0000-000000000001', 'Alandi', ST_SetSRID(ST_MakePoint(73.8012, 18.5801), 4326)::geography),
    ('20000000-0000-0000-0000-000000000001', 'Pirangut', ST_SetSRID(ST_MakePoint(73.7600, 18.5450), 4326)::geography)
ON CONFLICT (district_id, name) DO NOTHING;

-- CLUSTER 2: NASHIK (Sinnar hub - 2 villages within 10km)
INSERT INTO villages (district_id, name, location) VALUES
    ('20000000-0000-0000-0000-000000000002', 'Niphad', ST_SetSRID(ST_MakePoint(74.0200, 19.9100), 4326)::geography),
    ('20000000-0000-0000-0000-000000000002', 'Lasalgaon', ST_SetSRID(ST_MakePoint(74.1100, 19.8250), 4326)::geography)
ON CONFLICT (district_id, name) DO NOTHING;

-- CLUSTER 3: BENGALURU RURAL (Devanahalli hub - 2 villages within 10km)
INSERT INTO villages (district_id, name, location) VALUES
    ('20000000-0000-0000-0000-000000000003', 'Siddapura', ST_SetSRID(ST_MakePoint(77.7300, 13.2600), 4326)::geography),
    ('20000000-0000-0000-0000-000000000003', 'Hoskote', ST_SetSRID(ST_MakePoint(77.8100, 13.1900), 4326)::geography)
ON CONFLICT (district_id, name) DO NOTHING;

-- CLUSTER 4: MYSURU (Nanjangud hub - 2 villages within 10km)
INSERT INTO villages (district_id, name, location) VALUES
    ('20000000-0000-0000-0000-000000000004', 'Gundlupet', ST_SetSRID(ST_MakePoint(76.7300, 12.0800), 4326)::geography),
    ('20000000-0000-0000-0000-000000000004', 'Tirumakudal Narsipur', ST_SetSRID(ST_MakePoint(76.5900, 12.2100), 4326)::geography)
ON CONFLICT (district_id, name) DO NOTHING;

-- CLUSTER 5: DEHRADUN (UK Prototype - Horticulture & Services Focus - 6 villages within 10km)
-- Dehradun center: 30.2393° N, 78.1399° E
INSERT INTO villages (district_id, name, location) VALUES
    ('20000000-0000-0000-0000-000000000005', 'Clement Town', ST_SetSRID(ST_MakePoint(78.1500, 30.2600), 4326)::geography),
    ('20000000-0000-0000-0000-000000000005', 'Doiwala', ST_SetSRID(ST_MakePoint(78.2100, 30.1800), 4326)::geography),
    ('20000000-0000-0000-0000-000000000005', 'Dakpathar', ST_SetSRID(ST_MakePoint(78.0800, 30.3200), 4326)::geography),
    ('20000000-0000-0000-0000-000000000005', 'Herbertpur', ST_SetSRID(ST_MakePoint(78.0500, 30.2800), 4326)::geography),
    ('20000000-0000-0000-0000-000000000005', 'Saharanpur Road', ST_SetSRID(ST_MakePoint(78.1800, 30.3500), 4326)::geography),
    ('20000000-0000-0000-0000-000000000005', 'Vasantpur', ST_SetSRID(ST_MakePoint(78.0200, 30.1500), 4326)::geography)
ON CONFLICT (district_id, name) DO NOTHING;

-- ============================================================================
-- SECTION 4: BACKFILL NEARBY_VILLAGE_IDS USING PostGIS ST_DWithin
-- ============================================================================
-- Uses ST_DWithin to find all villages within 10km radius

UPDATE villages v1
SET nearby_village_ids = ARRAY(
    SELECT v2.id 
    FROM villages v2
    WHERE v1.id != v2.id
    AND v1.district_id = v2.district_id
    AND ST_DWithin(
        v1.location::geography,
        v2.location::geography,
        10000
    )
    ORDER BY ST_Distance(v1.location::geography, v2.location::geography) ASC
)
WHERE nearby_village_ids = '{}';

-- ============================================================================
-- SECTION 4: BACKFILL SHARED_POPULAR_BUSINESSES BY CLUSTER
-- ============================================================================

-- Pune Cluster (Agricultural + Industrial services)
UPDATE villages
SET shared_popular_businesses = ARRAY[
    'grocery_store',
    'fertilizer_shop',
    'seed_supplier',
    'pesticide_dealer',
    'tractor_service',
    'agri_tools_shop',
    'tea_stall',
    'cooperative_store'
]
WHERE district_id = '20000000-0000-0000-0000-000000000001'
AND shared_popular_businesses = '{}';

-- Nashik Cluster (Agriculture + Dairy/Food services)
UPDATE villages
SET shared_popular_businesses = ARRAY[
    'dairy_collection',
    'fertilizer_shop',
    'tractor_service',
    'tea_stall',
    'grocery_store',
    'seed_supplier',
    'agri_tools_shop',
    'cooperative_store',
    'water_pump_repair'
]
WHERE district_id = '20000000-0000-0000-0000-000000000002'
AND shared_popular_businesses = '{}';

-- Bengaluru Cluster (Digital + Modern services)
UPDATE villages
SET shared_popular_businesses = ARRAY[
    'fertilizer_shop',
    'seed_supplier',
    'tractor_service',
    'grocery_store',
    'mobile_repair',
    'digital_kiosk',
    'veterinary_clinic',
    'transport_service',
    'water_pump_repair'
]
WHERE district_id = '20000000-0000-0000-0000-000000000003'
AND shared_popular_businesses = '{}';

-- Mysuru Cluster (Spice trade + Agricultural services)
UPDATE villages
SET shared_popular_businesses = ARRAY[
    'pesticide_dealer',
    'seed_supplier',
    'fertilizer_shop',
    'tractor_service',
    'cooperative_store',
    'tea_stall',
    'agri_tools_shop',
    'transport_service',
    'dairy_collection'
]
WHERE district_id = '20000000-0000-0000-0000-000000000004'
AND shared_popular_businesses = '{}';

-- Dehradun Cluster (UK Prototype - Horticulture + Tech + Tourism services)
UPDATE villages
SET shared_popular_businesses = ARRAY[
    'fruit_vegetable_market',
    'apple_warehouse',
    'honey_cooperative',
    'food_processing_unit',
    'tea_stall',
    'grocery_store',
    'fertilizer_shop',
    'tractor_rental',
    'dairy_cooperative',
    'organic_farming_input',
    'mobile_repair',
    'digital_kiosk',
    'veterinary_clinic',
    'transport_service',
    'agritourism_services'
]
WHERE district_id = '20000000-0000-0000-0000-000000000005'
AND shared_popular_businesses = '{}';

-- Backfill original villages if not yet populated
UPDATE villages
SET shared_popular_businesses = ARRAY[
    'grocery_store',
    'fertilizer_shop',
    'seed_supplier',
    'tractor_service',
    'cooperative_store'
]
WHERE shared_popular_businesses = '{}';

-- ============================================================================
-- VERIFICATION QUERIES (Uncomment to validate after running migration)
-- ============================================================================
-- Verify new villages were inserted
-- SELECT COUNT(*) as total_villages FROM villages;
-- Expected: 20 villages (5 original + 15 new - focused on Dehradun UK prototype)

-- Verify Dehradun cluster (UK Prototype) - Primary focus
-- SELECT name, nearby_village_ids, shared_popular_businesses FROM villages 
-- WHERE district_id = '20000000-0000-0000-0000-000000000005'
-- ORDER BY name;

-- Verify PostGIS clustering for Pune cluster
-- SELECT name, nearby_village_ids, shared_popular_businesses FROM villages 
-- WHERE district_id = '20000000-0000-0000-0000-000000000001';

-- Verify business ecosystem backfill
-- SELECT name, shared_popular_businesses, array_length(shared_popular_businesses, 1) as business_count
-- FROM villages 
-- WHERE shared_popular_businesses != '{}' 
-- ORDER BY name;

-- Test ST_DWithin search: Find all villages within 10km of Hinjewadi
-- SELECT v.name, ST_Distance(v.location::geography, hinjewadi.location::geography)/1000 as distance_km
-- FROM villages v, villages hinjewadi
-- WHERE hinjewadi.name = 'Hinjewadi'
-- AND v.id != hinjewadi.id
-- AND ST_DWithin(v.location::geography, hinjewadi.location::geography, 10000)
-- ORDER BY distance_km;
