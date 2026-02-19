const volunteerForm = document.getElementById('volunteer-form');
const emergencyForm = document.getElementById('emergency-form');
const output = document.getElementById('output');

let volunteerLocation = null;
let emergencyLocation = null;

function captureLocation(statusEl, onSuccess) {
  if (!navigator.geolocation) {
    statusEl.textContent = 'Geolocation is not supported in this browser.';
    return;
  }

  statusEl.textContent = 'Capturing location...';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location = {
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6))
      };
      statusEl.textContent = `Captured lat ${location.lat}, lng ${location.lng}`;
      onSuccess(location);
    },
    (error) => {
      statusEl.textContent = `Could not capture location (${error.message}).`;
    }
  );
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

document.getElementById('volunteer-location-btn').addEventListener('click', () => {
  captureLocation(document.getElementById('volunteer-location-status'), (location) => {
    volunteerLocation = location;
  });
});

document.getElementById('emergency-location-btn').addEventListener('click', () => {
  captureLocation(document.getElementById('emergency-location-status'), (location) => {
    emergencyLocation = location;
  });
});

volunteerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(volunteerForm);

  if (!volunteerLocation) {
    output.textContent = 'Volunteer registration failed: capture location first.';
    return;
  }

  const payload = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    skills: String(formData.get('skills'))
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
    location: volunteerLocation
  };

  try {
    const data = await postJson('/api/volunteers', payload);
    output.textContent = JSON.stringify(data, null, 2);
    volunteerForm.reset();
  } catch (error) {
    output.textContent = error.message;
  }
});

emergencyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(emergencyForm);

  if (!emergencyLocation) {
    output.textContent = 'Emergency alert failed: capture location first.';
    return;
  }

  const payload = {
    requesterName: formData.get('requesterName'),
    requesterPhone: formData.get('requesterPhone'),
    skill: formData.get('skill'),
    notes: formData.get('notes'),
    location: emergencyLocation
  };

  try {
    const data = await postJson('/api/emergency', payload);
    output.textContent = JSON.stringify(data, null, 2);
    emergencyForm.reset();
  } catch (error) {
    output.textContent = error.message;
  }
});
