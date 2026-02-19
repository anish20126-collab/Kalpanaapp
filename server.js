const http = require('http');
const fs = require('fs');
const path = require('path');
const { findMatchingVolunteers } = require('./lib/matching');

const PORT = process.env.PORT || 3000;

const volunteers = [];
const emergencyRequests = [];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function isValidLocation(location) {
  return (
    location &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  );
}

function createMapLink(location) {
  return `https://maps.google.com/?q=${location.lat},${location.lng}`;
}

function createVolunteerNotification(volunteer, emergency) {
  return {
    toVolunteerId: volunteer.id,
    volunteerName: volunteer.name,
    requesterName: emergency.requesterName,
    requesterPhone: emergency.requesterPhone,
    neededSkill: emergency.skill,
    notes: emergency.notes,
    emergencyLocation: emergency.location,
    emergencyMapLink: createMapLink(emergency.location),
    volunteerDistanceKm: Number(volunteer.distanceKm.toFixed(2)),
    acknowledged: false
  };
}

function serveStaticFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'Content-Type': contentType });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  const { method, url } = request;

  if (method === 'POST' && url === '/api/volunteers') {
    try {
      const payload = await parseBody(request);
      if (!payload.name || !Array.isArray(payload.skills) || !isValidLocation(payload.location)) {
        sendJson(response, 400, {
          error: 'name, skills[], and valid location {lat,lng} are required.'
        });
        return;
      }

      const volunteer = {
        id: `vol-${Date.now().toString(36)}`,
        name: payload.name,
        phone: payload.phone || 'Not provided',
        skills: payload.skills,
        location: payload.location,
        registeredAt: new Date().toISOString()
      };

      volunteers.push(volunteer);
      sendJson(response, 201, { message: 'Volunteer registered.', volunteer });
      return;
    } catch (error) {
      sendJson(response, 400, { error: 'Invalid JSON payload.' });
      return;
    }
  }

  if (method === 'GET' && url === '/api/volunteers') {
    sendJson(response, 200, { volunteers, count: volunteers.length });
    return;
  }

  if (method === 'POST' && url === '/api/emergency') {
    try {
      const payload = await parseBody(request);
      if (!payload.requesterName || !payload.skill || !isValidLocation(payload.location)) {
        sendJson(response, 400, {
          error: 'requesterName, skill, and valid location {lat,lng} are required.'
        });
        return;
      }

      const emergency = {
        id: `emg-${Date.now().toString(36)}`,
        requesterName: payload.requesterName,
        requesterPhone: payload.requesterPhone || 'Not provided',
        skill: payload.skill,
        notes: payload.notes || '',
        location: payload.location,
        createdAt: new Date().toISOString()
      };

      const matchedVolunteers = findMatchingVolunteers({
        volunteers,
        requestSkill: emergency.skill,
        requestLocation: emergency.location,
        radiusKm: 25
      });

      const notifications = matchedVolunteers.map((volunteer) =>
        createVolunteerNotification(volunteer, emergency)
      );

      emergencyRequests.push({ ...emergency, notifications });

      sendJson(response, 201, {
        message: 'Emergency created and location-aware alerts prepared.',
        emergency,
        matchedVolunteers: matchedVolunteers.map((volunteer) => ({
          id: volunteer.id,
          name: volunteer.name,
          phone: volunteer.phone,
          distanceKm: Number(volunteer.distanceKm.toFixed(2)),
          volunteerLocation: volunteer.location,
          volunteerMapLink: createMapLink(volunteer.location)
        })),
        notifications
      });
      return;
    } catch (error) {
      sendJson(response, 400, { error: 'Invalid JSON payload.' });
      return;
    }
  }

  if (method === 'GET' && url === '/api/emergency') {
    sendJson(response, 200, { emergencyRequests, count: emergencyRequests.length });
    return;
  }

  const safeUrl = url === '/' ? '/index.html' : url;
  const publicPath = path.join(__dirname, 'public', safeUrl);

  if (!publicPath.startsWith(path.join(__dirname, 'public'))) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Invalid path');
    return;
  }

  serveStaticFile(response, publicPath);
});

server.listen(PORT, () => {
  console.log(`SkillSwap for Survival server running at http://localhost:${PORT}`);
});
