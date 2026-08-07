import fs from 'fs';
import path from 'path';
import { transformGcode, validateGcodeBounds } from '../utils/gcodeTransformer';
import { bilinearInterpolate } from '../utils/interpolation';
import { HeightMapData } from '../definitions';

const DIR = '/Users/huy/docs/cnc-gcodes';

const mapFor = (minX:number,maxX:number,minY:number,maxY:number): HeightMapData => {
  const pts:any[] = [];
  for (let iy=0; iy<5; iy++) for (let ix=0; ix<5; ix++) {
    const x = minX + (maxX-minX)*ix/4, y = minY + (maxY-minY)*iy/4;
    pts.push({x,y,z:+(0.25*Math.sin(Math.PI*ix/4) - 0.15*Math.cos(Math.PI*iy/4)).toFixed(4)});
  }
  return { bounds:{minX,maxX,minY,maxY}, resolution:{x:(maxX-minX)/4,y:(maxY-minY)/4}, points:pts, units:'mm' };
};

// Local corpus of real CAM output. Skipped when unavailable so the suite stays
// green on other machines and in CI.
const hasCorpus = fs.existsSync(DIR);
const maybe = hasCorpus ? it : it.skip;

maybe('every real program', () => {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.nc')).sort();
  const rows: string[] = [];
  let hardFail = 0;

  for (const f of files) {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    const probe = mapFor(-1e4,1e4,-1e4,1e4);
    const b = validateGcodeBounds(src, probe);
    if (!isFinite(b.gcodeMinX) || b.gcodeMaxX === b.gcodeMinX) {
      rows.push(`${f.padEnd(26)} | no motion`); continue;
    }
    const pad = 5;
    const map = mapFor(b.gcodeMinX-pad, b.gcodeMaxX+pad, b.gcodeMinY-pad, b.gcodeMaxY+pad);

    const t0 = Date.now();
    const r = transformGcode(src, map, { segmentLength: 1, warnOutsideBounds: true });
    const ms = Date.now() - t0;

    if (r.errors.length) {
      rows.push(`${f.padEnd(26)} | REFUSED: ${r.errors[0].slice(0,60)}`);
      continue;
    }

    const lines = r.transformedGcode.split('\n').map(l=>l.trim());
    const pt = lines.filter(l => /^G[01]\b/.test(l) && /X/.test(l) && /Y/.test(l) && /Z/.test(l))
      .map(l => ({
        x: parseFloat(l.match(/X(-?\d*\.?\d+)/i)![1]),
        y: parseFloat(l.match(/Y(-?\d*\.?\d+)/i)![1]),
        z: parseFloat(l.match(/Z(-?\d*\.?\d+)/i)![1]),
      }));

    const arcs = lines.filter(l=>/^G[23]\b/.test(l)).length;
    let jumps=0, maxJ=0;
    for (let i=1;i<pt.length;i++){
      const d=Math.hypot(pt[i].x-pt[i-1].x, pt[i].y-pt[i-1].y);
      if(d>1.5){jumps++;maxJ=Math.max(maxJ,d);}
    }

    const inch = /^\s*G20\b/m.test(src);
    const scale = inch ? 25.4 : 1;
    const srcZ = [...new Set((src.match(/\bZ(-?\d*\.?\d+)/g)||[]).map(w=>parseFloat(w.slice(1))*scale))];
    // Helical arcs interpolate Z continuously, so a reconstructed nominal need
    // not equal a discrete source depth. The sound invariant is that it must
    // never fall OUTSIDE the range the program spans -- that would mean the
    // compensation invented depth.
    const zLo = Math.min(...srcZ) - 0.002, zHi = Math.max(...srcZ) + 0.002;
    const outliers = pt.filter(p => {
      const n = p.z - bilinearInterpolate(p.x,p.y,map)!;
      return n < zLo || n > zHi;
    }).length;

    if (arcs || jumps || outliers) hardFail++;
    rows.push(
      `${f.padEnd(26)} | ${inch?'in':'mm'} | ${String(src.split('\n').length).padStart(6)} -> ${String(lines.length).padStart(6)} | ` +
      `arcs:${arcs} jumps:${jumps}(${maxJ.toFixed(1)}) zOutliers:${outliers} | ${ms}ms`
    );
  }

  console.log('file                       | u  |   in   ->  out    | invariants                          | time');
  console.log(rows.join('\n'));
  expect(hardFail).toBe(0);
});
