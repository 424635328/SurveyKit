import { netlifyAdapter } from './utils/compat.js';
import handler from '../../api/analyze-mbti.mjs';

export const handler = netlifyAdapter(handler);
