import { searchCards } from '../../lib/catalogue';
export const GET = () =>
  new Response(JSON.stringify(searchCards), { headers: { 'Content-Type': 'application/json' } });
