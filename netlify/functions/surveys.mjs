import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/surveys.mjs';

export const handler = netlifyAdapter(handler);
