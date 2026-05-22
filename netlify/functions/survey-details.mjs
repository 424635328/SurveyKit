import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/survey-details.mjs';

export const handler = netlifyAdapter(handler);
