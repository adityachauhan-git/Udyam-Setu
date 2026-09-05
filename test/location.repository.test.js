import assert from "node:assert/strict";
import test from "node:test";
import { createLocationRepository } from "../src/modules/locations/location.repository.js";

test("competition map repository returns the village and PostGIS-filtered businesses", async () => {
  const calls = [];
  const repository = createLocationRepository({
    query: async (sql, values) => {
      calls.push({ sql, values });
      return {
        rows: [{
          village_id: "village-1",
          village: "Hinjewadi",
          district: "Pune",
          state: "Maharashtra",
          village_latitude: 18.5912,
          village_longitude: 73.7389,
          id: "business-1",
          name: "Dairy Collective",
          business_type: "dairy",
          latitude: 18.592,
          longitude: 73.74,
          distance_km: "0.25",
        }],
      };
    },
  });

  const result = await repository.findCompetitionMapByUserId("user-1", "dairy", 10000);

  assert.equal(calls[0].values[0], "user-1");
  assert.equal(calls[0].values[1], "dairy");
  assert.equal(calls[0].values[2], 10000);
  assert.ok(calls[0].sql.includes("ST_DWithin"));
  assert.deepEqual(result.village, {
    id: "village-1",
    name: "Hinjewadi",
    district: "Pune",
    state: "Maharashtra",
    latitude: 18.5912,
    longitude: 73.7389,
  });
  assert.deepEqual(result.businesses, [{
    id: "business-1",
    name: "Dairy Collective",
    business_type: "dairy",
    latitude: 18.592,
    longitude: 73.74,
    distance_km: "0.25",
  }]);
});