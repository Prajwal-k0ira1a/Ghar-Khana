---
name: information-density
description: Critical design guidelines for information density, cognitive load reduction, and calm UI hierarchy. Use whenever designing, refactoring, or reviewing screens to ensure one primary question per screen, 3-level progressive disclosure, zero card-stack clutter, and restrained typography.
---

# Information Density & Calm UI Design Rule

## Core Tenet
> **Show what matters now. Hide what can wait.**

The interface must prioritize immediate customer intent and progressively reveal secondary information only when requested. A screen must feel calm and effortless even when the underlying business domain is complex.

---

## 1. One Primary Question Per Screen
Every screen exists to answer exactly one primary question:

| Screen | Primary Question | Primary Action | Forbidden on Initial View |
| :--- | :--- | :--- | :--- |
| **Home** | "What am I eating today?" | Modify today's dish | Revenue stats, kitchen analytics, long rule summaries, marketing banners |
| **Discover** | "Which kitchen fits my daily routine?" | View kitchen profile | Long bios, capacity charts, multiple action buttons per card |
| **Calendar** | "What meals are coming up and can I edit them?" | Change or skip selected date | Redundant schedule summaries, duplicate status labels |
| **Provider Dashboard** | "What am I cooking right now?" | Advance batch status | Long customer rosters, tomorrow's prep, financial histories |
| **Delivery** | "What is my immediate next action?" | Pick up / Start delivery | Complex delivery trees, all actions simultaneously |

---

## 2. Three-Level Information Hierarchy

### Level 1 — NOW (Visible Immediately)
- Information the user needs to act or know in under 3 seconds.
- *Examples*: Today's meal slot, dish title, delivery arrival window, current state, active cutoff time, amount due.

### Level 2 — SOON (Secondary / Below Fold)
- Useful context that does not demand immediate action.
- *Examples*: Tomorrow's meal preview, upcoming 2-3 days, kitchen name, subscription frequency.

### Level 3 — DETAILS (On Request Only)
- Deep metadata shown only after an explicit tap, detail transition, or bottom sheet.
- *Examples*: Full recipe ingredients, detailed operational policies, full payment receipts, detailed customer reviews, delivery landmark notes.
- **Rule**: Never place Level 3 information directly in Level 1 space.

---

## 3. The 3-Second Test
Within three seconds of opening a screen, the user must understand:
1. **Where am I?** (Clear, uncluttered context)
2. **What is important?** (High-contrast primary element)
3. **What can I do?** (Single clear primary CTA)

If the user has to read paragraphs or parse multiple nested cards, the design has failed the test.

---

## 4. List Item Density Limit
A list item should contain:
- **1 Primary piece of information** (e.g., Kitchen Name or Dish Name)
- **2 to 3 Supporting pieces of information** (e.g., Type · Distance · Starting Price)

### Bad (Overload):
```
[Title] [Subtitle] [Description] [Rating] [Distance] [Price] [Capacity Badge] [Veg Badge] [Instant Action]
```

### Good (Calm & Readable):
```
Sita's Kitchen
Home kitchen · 1.8 km
From NPR 180 / meal · 4.8 rating
```

---

## 5. Stop Using Cards as Default Containers
Do not create a floating card stack (`[Card] [Card] [Card] [Card]`).
- Group related items with **whitespace, alignment, and hairline 1px dividers** (`#E2E8F0`).
- Whitespace communicates structure more elegantly than bordered boxes and drop shadows.

---

## 6. Over-Labelling & Redundancy Ban
- **No Over-labelling**: Do not write `MEAL: Dal Bhat`, `TIME: 12:30 PM`, `KITCHEN: Sita's Kitchen`. Natural visual hierarchy communicates what the data represents.
- **No Redundancy**: If a state is `Preparing`, do not show a badge, a status text, an alert box, and an icon all saying "Preparing". One clear indicator is enough.
- **No Badge Spam**: Do not turn every attribute into a pill badge. Reserve badges strictly for critical state tags.

---

## 7. Natural, Concise Human Language
- Avoid AI marketing fluff ("Experience seamless culinary excellence").
- Use calm, functional human copy:
  - "Changes close at 10:30 AM."
  - "Lunch is being prepared."
  - "Skip Thursday's lunch."

---

## 8. The 20% Pruning Check
Before finalizing any screen:
1. Identify and remove **20% of the visible information**.
2. If essential functionality remains intact, keep it removed.
3. Identify and remove one more visual container or border. If clarity increases, keep it removed.
