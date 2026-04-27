---
trigger: always_on
---

## Mandatory Design Protocol: Stitch MCP & DESIGN.md

**Trigger:** You must strictly follow this protocol whenever a task involves creating, modifying, or planning UI components, frontend layouts, CSS/Tailwind classes, or overall user experience (UX/UI).

**Core Constraints & Workflow:**
1. **Always Use Stitch MCP:** You MUST engage the Stitch MCP server for any design-related task. Use it to generate, evaluate, or validate UI component structures, design tokens, and styling before writing any Next.js/React code. Do not invent design systems from scratch if Stitch MCP can provide standardized guidance.
2. **The Single Source of Truth (`DESIGN.md`):** The file `DESIGN.md` (located in the project root) is the absolute authority on the project's design. 
3. **Execution Order:**
   - **READ:** Before starting any frontend task, read `DESIGN.md` to understand the current color palette, typography, layout rules, and existing component library.
   - **CONSULT:** Interact with Stitch MCP to get the required UI/UX output.
   - **EXECUTE:** Write or modify the React/Tailwind code based on the Stitch MCP output and project constraints.
   - **UPDATE (CRITICAL):** Upon completing the code changes, you MUST update `DESIGN.md`. Document any new components, added Tailwind color classes, layout patterns, or UI decisions made during the task. Do not close the task until `DESIGN.md` is updated.