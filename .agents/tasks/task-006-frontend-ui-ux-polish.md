# Task 006: Frontend UI/UX Polish

## Objective
Enhance the user experience of the Explore feed by implementing loading states, empty states, and toast notifications.

## Context
During the completion of Phase 1 (Task 005), we successfully integrated the backend search API. However, the user experience during network requests and error states needs improvement to meet our premium aesthetic standards.

## Requirements
1. **Loading Skeletons (`loading.tsx`)**
   - Implement Next.js `loading.tsx` for the `/explore` route.
   - Design a skeleton loader for `PlaceCard` and `PlaceCardSmall` components.
   - Maintain the premium aesthetic (rounded corners, subtle animations).

2. **Empty States**
   - Create a high-quality `EmptyState` component for when search results (or filters) return 0 items.
   - Provide a clear message and a "Reset Filters" or "Change Location" call-to-action button.

3. **Toast Notifications**
   - Introduce a Toast notification system (e.g., using `sonner` or a custom Tailwind implementation).
   - Replace the inline geolocation error message in `LocationFilter.tsx` with a global toast notification.

## Constraints & Rules
- Follow `DESIGN.md` for styling guidelines.
- Remember the `version-control-protocol.md`: Do not commit your changes. Notify the Orchestrator when done.
- If necessary, consult Stitch MCP for generating the Empty State UI or Skeleton loaders.

## Status
- [ ] Implement `loading.tsx` and skeletons.
- [ ] Create `EmptyState` component and integrate it into the feed.
- [ ] Set up Toast notifications and update `LocationFilter.tsx`.
