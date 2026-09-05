# Database SQL layout

`migrations/004_add_gis_market_data.sql` is a forward-only extension for an
existing database that has already applied the base schema, onboarding, and
village-cluster migrations. It creates reusable, geolocated market facts and
does not remove or rewrite existing data.

`seed/gis_market_data.sql` supplies repeatable demonstration records. Run it
only after the GIS migration and after the existing location seed data.

`migrations/005_retire_legacy_village_market_arrays.sql` removes the former
`villages` proximity and business-label arrays. Apply it only after deploying
the GIS-backed chat service; it must run after migration 004.

`full_setup.sql` is the clean, self-contained setup for a new database. It
includes the final schema and the current project seed locations.

`legacy/full_database_setup_pre_gis.sql` is the previous root-level setup
snapshot, retained only as a historical reference. Do not use it for a new
database.

## Compatibility decisions

- The former `villages.shared_popular_businesses` and
  `villages.nearby_village_ids` columns are retired in migration 005. The chat
  service now reads reusable GIS market facts through PostGIS radius queries.
- The final setup accepts the plain capital and income range values emitted by
  `src/modules/onboarding/onboarding.service.js`: `0-25k`, `25k-1L`, `1-5L`,
  `5L+`; and `5k-10k`, `10k-25k`, `25k-50k`, `50k+`. This matches the separate
  onboarding migration. The extra display-form variants in the previous full
  setup are not emitted by the current application.
- Financial calculations remain in memory. No financial migration is included.
- The new tables hold observed local facts; no AI-generated reports are stored.
