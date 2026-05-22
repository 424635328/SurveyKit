import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/get-public-survey.mjs';

export const handler = netlifyAdapter(handler);
