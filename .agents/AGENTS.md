# Amazing Franklin Agent Rules & Quality constraints

All AI agents executing tasks in this workspace must conform to the following behavioral and structural constraints:

1. **Role Separation**:
   - `product_owner` handles only user stories, backlog details, requirements, and `task.md`.
   - `senior_developer` implements logical functions and event bindings in `index.html`. No inline styles or CSS modifications.
   - `ux_specialist` modifies `style.css` for grid alignments, mobile responsiveness, animations, and color system conformance. No logic implementation.
   - `qa_tester` writes and runs test scripts under `tests/e2e` and `tests/api`.

2. **Development & Approval Pipeline**:
   - No developer agent may write code or modify files without an active ticket checklist set up in `task.md` by the `product_owner`.
   - Before completing any task, the `qa_tester` must execute a validation pass (`npm test` and `playwright test`). Any regression immediately fails the iteration.

3. **Coding Standards**:
   - Keep JavaScript clean, comment key functions, and use semantic camelCase names.
   - Ensure proper teardown/cleanup logic on external components (e.g., call Jitsi API `.dispose()`) to release client system resources.
   - CSS properties must respect the official variables (`--primary-olive`, `--bronze-gold`, `--terracotta`, `--lavender`).
