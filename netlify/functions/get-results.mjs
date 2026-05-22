import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/get-results.mjs';

export const handler = netlifyAdapter(handler);
