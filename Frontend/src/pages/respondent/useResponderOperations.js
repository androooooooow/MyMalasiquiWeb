import { useCallback, useEffect, useState } from 'react';
import {
  acceptEmergencyRequest,
  fetchResponseTeam,
  fetchResponderQueue,
  getEmergencyError,
  updateEmergencyStatus,
  updateResponderLocation,
} from '../../api/emergencies';

const locationOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };

export default function useResponderOperations(user) {
  const [incidents, setIncidents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const travellingIdsKey = incidents
    .filter((incident) => incident.status === 'EN_ROUTE' && incident.assignedResponder?.id === user.id)
    .map((incident) => incident.id).sort().join(',');

  const loadQueue = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      setIncidents(await fetchResponderQueue());
    } catch (requestError) {
      setError(getEmergencyError(requestError, 'The responder queue could not be loaded.'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const interval = window.setInterval(() => loadQueue({ silent: true }), 5000);
    return () => window.clearInterval(interval);
  }, [loadQueue]);

  useEffect(() => {
    let active = true;
    const loadTeam = async () => {
      try {
        const members = await fetchResponseTeam();
        if (active) setTeamMembers(members);
      } catch {
        // Keep the incident queue usable if the team roster is unavailable.
      }
    };
    loadTeam();
    const interval = window.setInterval(loadTeam, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!travellingIdsKey || !navigator.geolocation) return undefined;
    const travellingIds = travellingIdsKey.split(',');

    let lastSentAt = 0;
    const watchId = navigator.geolocation.watchPosition(async (position) => {
      if (Date.now() - lastSentAt < 8000) return;
      lastSentAt = Date.now();

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: Math.round(position.coords.accuracy),
      };
      const updates = await Promise.allSettled(
        travellingIds.map((id) => updateResponderLocation(id, location)),
      );

      setIncidents((current) => current.map((incident) => {
        const index = travellingIds.indexOf(incident.id);
        return index >= 0 && updates[index].status === 'fulfilled' ? updates[index].value : incident;
      }));
    }, () => {
      setError('Live GPS sharing stopped. Allow location access so the citizen can track your response.');
    }, { ...locationOptions, maximumAge: 5000 });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [travellingIdsKey]);

  async function acceptIncident(id) {
    setBusyId(id);
    setError('');
    try {
      const updated = await acceptEmergencyRequest(id);
      setIncidents((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (requestError) {
      setError(getEmergencyError(requestError, 'This request could not be accepted.'));
      await loadQueue();
    } finally {
      setBusyId('');
    }
  }

  async function changeStatus(id, status) {
    setBusyId(id);
    setError('');
    try {
      if (status === 'EN_ROUTE') {
        if (!navigator.geolocation) throw new Error('Location sharing is not supported by this browser.');
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, locationOptions);
        });
        await updateResponderLocation(id, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: Math.round(position.coords.accuracy),
        });
      }

      const updated = await updateEmergencyStatus(id, status);
      setIncidents((current) => (
        status === 'RESOLVED'
          ? current.filter((item) => item.id !== id)
          : current.map((item) => (item.id === id ? updated : item))
      ));
    } catch (requestError) {
      setError(getEmergencyError(requestError, 'The emergency status could not be updated.'));
    } finally {
      setBusyId('');
    }
  }

  return {
    incidents,
    teamMembers,
    loading,
    error,
    busyId,
    loadQueue,
    acceptIncident,
    changeStatus,
  };
}
