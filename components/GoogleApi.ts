// components/GoogleApi.ts
import axios from 'axios';

// Coloque sua chave no .env e injete no runtime. Aqui uso process.env.GOOGLE_API_KEY como placeholder.
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyB04l5HfTPqiQJ9x0Pa9E9wd58Qfa8fB8w';

// Endpoints úteis
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const PLACES_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export async function geocodeLatLng(lat: number, lng: number) {
  const url = `${GEOCODE_URL}?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
  const res = await axios.get(url);
  return res.data;
}

export async function getDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
  const url = `${DIRECTIONS_URL}?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${GOOGLE_API_KEY}`;
  const res = await axios.get(url);
  return res.data;
}

export async function placesAutocomplete(input: string, locationBias?: { lat: number; lng: number; radius?: number }) {
  let url = `${PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&types=geocode`;
  if (locationBias) {
    url += `&location=${locationBias.lat},${locationBias.lng}`;
    if (locationBias.radius) url += `&radius=${locationBias.radius}`;
  }
  const res = await axios.get(url);
  return res.data;
}

export async function placeDetails(placeId: string) {
  const url = `${PLACE_DETAILS_URL}?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
  const res = await axios.get(url);
  return res.data;
}
