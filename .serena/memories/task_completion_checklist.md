When finishing a change:
- Run targeted manual command-level checks in a disposable git repo for changed flows.
- At minimum validate impacted commands (`cpw init/create/list/status` as relevant).
- Run syntax checks / sanity checks (e.g., `node --check` on changed files when appropriate).
- Summarize purpose, scope, and validation commands/output for PR notes.