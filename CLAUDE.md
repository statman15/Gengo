# Gengo

Japanese learning app for Chris and friends (Android app, web app for iPhone). Read PLAN.md for decisions and status, DESIGN.md for the visual system, PARKING_LOT.md for deferred ideas.

## Every change ships to both apps

- The web app (GitHub Pages, https://statman15.github.io/Gengo/) and the Android app (Capacitor APK on GitHub Releases) run the **same web files** at the repo root. A push to `main` deploys Pages and builds a signed APK release.
- Never build a feature only into `android/`. Native-only behaviour (Capacitor plugins) needs a web equivalent, or tell Chris what the iPhone can't do.
- After pushing, confirm both: the Pages build finished and serves the new code, and the Android APK workflow published a release.
- **CI gates every push** (`npm run smoke` loads the app in headless Chrome and fails on any console/page error, blocking both the APK and the Pages deploy), but still **before every push, load the app in the browser pane** (local server on :5173) **and check the console for errors.** `npm test` only covers pure logic, not the UI modules.

## Delegate to cheaper models

Hand work to Agent-tool sub-agents via the `model` parameter:
- **haiku**: mechanical work. Searches, running `npm test`, checking CI runs, releases and Pages deploys, simple well-specified edits, screenshots and read-only checks.
- **sonnet**: well-scoped building. Implementing a feature from a clear spec, writing tests, code and security reviews, browser or emulator test passes.
- **Opus (the main session)**: planning, design decisions, specs for the agents, integrating and checking their work, and talking with Chris.
Give each agent a self-contained prompt (paths, the spec, what "done" means) and check its result before shipping.

## Working here

- No build step for the web app: plain ES modules. `npm test` runs the checks, `npm run smoke` loads the app in headless Chrome, `npm run sync` copies the web files into the Android project (never edit `www/` or `android/app/src/main/assets` by hand).
- Local preview: `npx http-server -p 5173 -c-1` from the repo root.
- Android Studio's bundled Java 25 can't run Gradle 8.14; `android/gradle/gradle-daemon-jvm.properties` asks for Java 21.
- Release signing reuses HypertroPhy's keystore (alias `hypertrophy`), via repo secrets KEYSTORE_B64 / KEYSTORE_PASSWORD.
