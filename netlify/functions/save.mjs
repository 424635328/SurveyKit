import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/save.mjs';

export const handler = netlifyAdapter(handler);
