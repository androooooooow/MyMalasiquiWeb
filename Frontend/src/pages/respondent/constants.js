export const NAV_ITEMS = [
  { key: 'overview', path: 'operations', label: 'Operations', icon: 'home' },
  { key: 'incidents', path: 'incidents', label: 'Incidents', icon: 'alert' },
  { key: 'dispatch', path: 'dispatch-map', label: 'Dispatch map', icon: 'map' },
  { key: 'teams', path: 'response-teams', label: 'Response teams', icon: 'users' },
  { key: 'messages', path: 'communications', label: 'Communications', icon: 'chat' },
  { key: 'profile', path: 'profile', label: 'My profile', icon: 'user' },
];

export const SERVICE_LABELS = {
  AMBULANCE: 'Ambulance / medical',
  FIRE: 'Fire rescue',
  POLICE: 'Police assistance',
  SEARCH_RESCUE: 'Search & rescue',
  DISASTER: 'Disaster response',
  OTHER: 'Other emergency',
};

export const RESPONDER_UNIT_LABELS = {
  HEALTH_AMBULANCE: 'Health / Ambulance',
  PNP_POLICE: 'PNP / Police',
  BFP_FIRE: 'BFP / Fire Truck',
  MDRRMO: 'MDRRMO',
};
