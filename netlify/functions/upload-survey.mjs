import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/upload-survey.mjs';

export const handler = netlifyAdapter(handler);
