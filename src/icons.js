// Lucide icons rendered as inline SVG strings (one stroke weight across the presentation).
import {
  ArrowRight, BookOpen, Check, CircleAlert, ClipboardList, Droplets, EqualNot, Factory, FileText, Gavel, Headset,
  Landmark, Library, Lock, MessagesSquare, Moon, Phone, Ruler, Scale, ScrollText, Server, ShieldCheck, Sun, Timer,
  Trees, User, Wind,
} from 'lucide';

const SET = {
  arrowRight: ArrowRight, bookOpen: BookOpen, check: Check, circleAlert: CircleAlert, clipboardList: ClipboardList,
  droplets: Droplets, equalNot: EqualNot, factory: Factory, fileText: FileText, gavel: Gavel, headset: Headset,
  landmark: Landmark, library: Library, lock: Lock, messagesSquare: MessagesSquare, moon: Moon, phone: Phone,
  ruler: Ruler, scale: Scale, scrollText: ScrollText, server: Server, shieldCheck: ShieldCheck, sun: Sun,
  timer: Timer, trees: Trees, user: User, wind: Wind,
};

function inner(name) {
  const node = SET[name];
  if (!node) throw new Error(`Unknown icon: ${name}`);
  return node
    .map(([tag, attrs]) => `<${tag}${Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('')}/>`)
    .join('');
}

const ATTRS = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" ${ATTRS} aria-hidden="true">${inner(name)}</svg>`;
}
