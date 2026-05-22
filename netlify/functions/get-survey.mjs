import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/get-survey.mjs';

export const handler = netlifyAdapter(handler);
