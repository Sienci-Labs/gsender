# Translating gSender

gSender's interface can be shown in several languages. Translations live in
plain JSON files in this repository, and anyone can improve them with a pull
request — no programming needed.

| Language | Code | Status |
|---|---|---|
| English | `en` | Source language |
| Deutsch | `de` | Machine-translated seed, needs review |
| Español | `es` | Machine-translated seed, needs review |
| Français | `fr` | Machine-translated seed, needs review |
| Italiano | `it` | Machine-translated seed, needs review |
| Русский | `ru` | Machine-translated seed, needs review |

Not all of the app is translatable yet. Areas are converted a few at a time,
and anything not yet converted shows in English.

**What always stays English:** text that comes from your CNC controller's
firmware (grblHAL setting descriptions, alarm and error messages reported by
the board, console output), G-code, `$` settings, and units sent to the machine.

---

## For translators

### Where the files are

```
src/app/src/i18n/locales/
  en/                  ← English source text (don't edit to translate)
    common.json        ← buttons, navigation, words used everywhere
    config.json        ← the Config / Settings page
    notifications.json ← pop-up notifications and confirmation dialogs
    helper.json        ← alarm and error help
  de/  es/  fr/  it/  ru/   ← one folder per language, same files
```

Each file is a set of nested `"key": "text"` pairs. Translate the **text on
the right**. Never change the keys on the left.

```json
// en/common.json
{ "actions": { "cancel": "Cancel" } }

// de/common.json
{ "actions": { "cancel": "Abbrechen" } }
```

### Fixing or finishing a translation

1. Open the file for your language on GitHub, e.g.
   `src/app/src/i18n/locales/fr/config.json`, and click the ✏️ edit button.
2. Change the text. An empty value (`""`) means "not translated yet", so
   gSender shows the English text there instead.
3. Commit to a new branch and open a pull request. Add the `translation`
   label if you can.

If you have reviewed a whole language, set `"reviewed": true` in that
language's `_meta.json`.

### Rules

- **Placeholders** look like `{{name}}`. Keep them exactly as they are,
  including the spelling inside the braces, and move them wherever your
  grammar needs them:
  `"Restored {{setting}} to default value of {{value}}"` →
  `"{{setting}} auf den Standardwert {{value}} zurückgesetzt"`.
- **Tags** like `<0>…</0>` or `<bold>…</bold>` wrap part of a sentence that
  gets a link or styling. Keep each tag and translate the text inside it.
- **Plurals.** Keys ending in `_one`, `_other` (and in Russian `_few`, `_many`)
  are forms of the same message for different counts. Fill in every form your
  language uses.
- **Don't translate** product names (gSender, gCAM, grblHAL, Grbl, AutoZero,
  BitZero, LongMill, AltMill), G-code and M-codes (`G54`, `M30`), `$` settings
  (`$22`, `$H`) or units (`mm`, `in`, `mm/min`, `RPM`).
- Use the CNC terminology machinists in your language actually use (homing,
  limit switch, touch plate, spindle, feed rate, work coordinates…).
- Keep it short where English is short: button and menu text has limited room.

### Checking your work

You don't need to build gSender to contribute. If you can run it from source:

```bash
yarn install
yarn dev            # then Config → Basics → Language
yarn i18n:status    # how much of each language is translated
```

A check runs on every pull request and tells you if a placeholder or tag
doesn't match the English text.

### Adding a new language

1. Copy `src/app/src/i18n/locales/en/` to a folder named after the language
   code (`pt-BR`, `nl`, `ja`…). Empty every value (`""`), or ask a maintainer to
   run `yarn i18n:extract`, which does that for you.
2. Add the language to `SUPPORTED_LANGUAGES` in
   `src/app/src/i18n/languages.ts`, using its own name (`Nederlands`, not
   `Dutch`).
3. Add the code to `locales` in `i18next.config.ts`.
4. Add a `_meta.json` with `{ "reviewed": false }`.
5. Translate, then open a pull request.

---

## For developers

### Tagging text

Text that is shown to users goes through i18next. Keys are **semantic and
namespaced**: `namespace:area.component.purpose`, camelCase, with English as
the source text. Keys are type-checked, so a typo is a compile error.

**Always write the namespace prefix** (`t('config:profile.save')`, never
`t('profile.save')`). The app compiles with `strictNullChecks` off, and
i18next's types only accept namespace-relative keys under strict null checks.
Use `useAppTranslation()` rather than react-i18next's `useTranslation()` for the
same reason: it loads every namespace so interpolated calls type-check too.
One key format everywhere also makes keys easy to search for.

**In components:**

```tsx
import { useAppTranslation } from 'app/i18n';

const { t } = useAppTranslation();
return <button>{t('config:profile.save')}</button>;
```

**Outside React** (toasts, dialogs, sagas, utils):

```ts
import { i18n } from 'app/i18n';

toast.info(i18n.t('notifications:gcode.copiedToClipboard'));
```

**In module-level data** (menus and settings arrays built before a language
is chosen), mark the key with `tk()` and translate it where it is rendered:

```ts
import { tk, translateKey } from 'app/i18n';

const item = { label: tk('config:basics.units.label') };
// …later, in a component that calls useAppTranslation() so it re-renders:
<span>{translateKey(item.label)}</span>
```

`translateKey()` returns non-key text unchanged, so it's safe on values that
might also come from the controller.

**Interpolation and plurals.** Never build sentences by concatenating strings;
word order differs between languages.

```ts
t('config:eeprom.restored', { setting, value }); // "Restored {{setting}} to {{value}}"
t('notifications:files.selected', { count });   // files.selected_one / files.selected_other
```

**Inline markup** uses `<TransKey>` (a typed wrapper around react-i18next's
`<Trans>`, whose own key type doesn't work with this tsconfig):

```tsx
<TransKey i18nKey="helper:alarm.homing.hint" components={{ link: <a href={url} /> }} />
// "Check the <link>homing guide</link>."
```

**Don't translate protocol values.** Machine states (`Idle`, `Alarm`), stored
option values, G-code and units sent to the controller stay as they are. If
one is shown to the user, map it to a display key (see `labels` on select
settings in `SettingsMenu.ts`).

### Namespaces

| Namespace | Use for |
|---|---|
| `common` | Buttons, navigation, words used everywhere |
| `config` | Config / Settings page |
| `notifications` | Toasts and confirmation dialogs |
| `helper` | Alarm and error help |

When you convert a new feature area (Probe, Surfacing, Job Control…), give it
its own namespace: add `locales/en/<ns>.json`, register it in
`locales/en/index.ts`, then run `yarn i18n:extract` to create the other
languages' files.

### Workflow

```bash
yarn i18n:extract   # add keys used in code to the locale files (other languages get "")
yarn i18n:status    # coverage per language and namespace
yarn i18n:unused    # keys no longer used in code (never deleted automatically)
yarn i18n:lint      # hardcoded JSX text and placeholder mismatches
yarn i18n:check     # what CI runs
```

Run `yarn i18n:extract` before committing new text. Untagged text that already
existed is recorded in `src/app/src/i18n/lint-baseline.json`, so CI only fails
on **new** hardcoded text. After converting an area, run `yarn i18n:baseline`
to shrink the baseline.

### Notes

- Translations are bundled with the app and work offline. English is always
  loaded; other languages are code-split and loaded when selected.
- The notifications list stores messages as they were shown, so switching
  language doesn't re-translate old notifications.
- Electron's native dialogs (in `src/main.js`) aren't translated yet.
