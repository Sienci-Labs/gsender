import type { PostProcessorModule } from 'i18next';
import { PSEUDO_LANGUAGE } from './languages';

const ACCENTED: Record<string, string> = {
    a: 'à',
    b: 'ƀ',
    c: 'ç',
    d: 'ð',
    e: 'é',
    f: 'ƒ',
    g: 'ĝ',
    h: 'ĥ',
    i: 'î',
    j: 'ĵ',
    k: 'ķ',
    l: 'ļ',
    m: 'ɱ',
    n: 'ñ',
    o: 'ö',
    p: 'þ',
    q: 'ǫ',
    r: 'ŕ',
    s: 'š',
    t: 'ţ',
    u: 'û',
    v: 'ṽ',
    w: 'ŵ',
    x: 'ẋ',
    y: 'ý',
    z: 'ž',
    A: 'À',
    B: 'Ɓ',
    C: 'Ç',
    D: 'Ð',
    E: 'É',
    F: 'Ƒ',
    G: 'Ĝ',
    H: 'Ĥ',
    I: 'Î',
    J: 'Ĵ',
    K: 'Ķ',
    L: 'Ļ',
    M: 'Ṁ',
    N: 'Ñ',
    O: 'Ö',
    P: 'Þ',
    Q: 'Ǫ',
    R: 'Ŕ',
    S: 'Š',
    T: 'Ţ',
    U: 'Û',
    V: 'Ṽ',
    W: 'Ŵ',
    X: 'Ẋ',
    Y: 'Ý',
    Z: 'Ž',
};

/**
 * Accents every letter, pads the text by ~30% (translations often run longer
 * than English) and wraps it in brackets. Markup like `<1>…</1>` used by
 * <Trans> is left untouched.
 */
export const pseudoLocalize = (value: string): string => {
    let out = '';
    let inTag = false;
    let letters = 0;
    for (const ch of value) {
        if (ch === '<') {
            inTag = true;
        }
        if (inTag) {
            out += ch;
            if (ch === '>') {
                inTag = false;
            }
            continue;
        }
        if (ACCENTED[ch]) {
            letters++;
        }
        out += ACCENTED[ch] ?? ch;
    }
    const padding = '~'.repeat(Math.ceil(letters * 0.3));
    return `[${out}${padding}]`;
};

export const pseudoPostProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'pseudo',
    process(value: string, _key, _options, translator) {
        if (translator?.language !== PSEUDO_LANGUAGE) {
            return value;
        }
        return pseudoLocalize(value);
    },
};
