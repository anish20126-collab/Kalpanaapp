function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(a, b) {
  const earthRadiusKm = 6371;
  const latDiff = toRadians(b.lat - a.lat);
  const lngDiff = toRadians(b.lng - a.lng);

  const haversine =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusKm * centralAngle;
}

function findMatchingVolunteers({ volunteers, requestSkill, requestLocation, radiusKm = 15 }) {
  return volunteers
    .filter((volunteer) =>
      volunteer.skills.some((skill) => skill.toLowerCase() === requestSkill.toLowerCase())
    )
    .map((volunteer) => {
      const distanceKm = haversineDistanceKm(requestLocation, volunteer.location);
      return { ...volunteer, distanceKm };
    })
    .filter((volunteer) => volunteer.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

module.exports = {
  haversineDistanceKm,
  findMatchingVolunteers
};
