// Writes public/hero.svg from the Hero component, for the static landing page and link previews.
import { writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { Hero } from '../src/components/Hero';

const svg = renderToStaticMarkup(<Hero />).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
writeFileSync(new URL('../public/hero.svg', import.meta.url), svg);
console.log('wrote public/hero.svg', svg.length, 'bytes');
