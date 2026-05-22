import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/submissions.mjs';

export const handler = netlifyAdapter(handler);
