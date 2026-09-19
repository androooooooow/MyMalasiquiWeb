export default function googleDirectionsUrl(emergency) {
  const destination = encodeURIComponent(`${emergency.latitude},${emergency.longitude}`);
  const hasResponder = Number.isFinite(emergency.responderLatitude) && Number.isFinite(emergency.responderLongitude);
  const origin = hasResponder ? `&origin=${encodeURIComponent(`${emergency.responderLatitude},${emergency.responderLongitude}`)}` : '';
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination}&travelmode=driving`;
}
