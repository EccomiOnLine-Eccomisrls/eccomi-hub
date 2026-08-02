# Barbara Command Center

Barbara is the modular command and search layer for ECCOMI HUB.

## Current scope

- Natural-language normalization and token scoring.
- Search across commands, clients, ecosystems and decisions.
- Ranked quick actions when the search field is empty.
- Separation between the search engine and the HUB interface.

## Integration

The integration workflow updates only the `searchResults` block and the Barbara import in `src/App.tsx`, then runs the production build before committing the application change.

## Next modules

Future ECCOMI verticals will register commands, routes and searchable entities without rewriting the core search engine.
