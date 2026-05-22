import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/auth.mjs';

export const handler = netlifyAdapter(handler);
