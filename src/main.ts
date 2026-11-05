import './style.css';
import { initUI } from './ui.ts';
import { initMotion } from './motion.ts';

const reduced = initUI();
await document.fonts.ready;
requestAnimationFrame(() => initMotion(reduced));
