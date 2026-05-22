import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/recover-link.mjs';

export const handler = netlifyAdapter(handler);
