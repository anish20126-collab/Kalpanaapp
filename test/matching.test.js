const test = require('node:test');
const assert = require('node:assert/strict');
const { haversineDistanceKm, findMatchingVolunteers } = require('../lib/matching');

test('haversineDistanceKm returns zero for same point', () => {
  const point = { lat: 12.9716, lng: 77.5946 };
  assert.equal(haversineDistanceKm(point, point), 0);
});

test('findMatchingVolunteers filters by skill and distance', () => {
  const volunteers = [
    {
      id: 'v1',
      name: 'Ana',
      skills: ['First Aid'],
      location: { lat: 12.9716, lng: 77.5946 }
    },
    {
      id: 'v2',
      name: 'Ben',
      skills: ['Electric Repair'],
      location: { lat: 12.9352, lng: 77.6245 }
    }
  ];

  const matches = findMatchingVolunteers({
    volunteers,
    requestSkill: 'First Aid',
    requestLocation: { lat: 12.97, lng: 77.59 },
    radiusKm: 10
  });

  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, 'v1');
});
