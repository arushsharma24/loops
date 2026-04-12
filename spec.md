Loops — Product Spec
1. Overview
Loops is a personal command center for work and life.
It helps me stay inside the right thread of work, know what the next useful action is, and safely put away things that matter later without losing them.
This is not just a to-do app. It is a system for handling:
ongoing work threads
nested projects and subprojects
thoughts and notes
reminders and resurfacing
personal and work life in one place
scheduling through calendar integration
lightweight second-brain behavior
The central idea is that most of life is not made of isolated tasks. It is made of threads. In Loops, those threads are called loops.

2. Product Vision
Build an app I can use as my main personal operating system.
When I open it, I should immediately know:
what I am currently working on
what the next important thing is
what is waiting
what I deliberately saved for later
what belongs to work vs personal life
what needs to resurface based on time or context
The app should feel:
simple
calm
fast
recursive
trustworthy
easy to capture into
easy to return to many times a day
It should work on:
web
Android
eventually a compact desktop utility / always-on-top mode

3. Core Product Idea
The defining feature of Loops is not “tasks + notes.”
The defining feature is:
I work inside loops, not inside disconnected lists.
A loop is a thread of intent.
 It can be:
a project
a task cluster
a thought to explore
a responsibility area
a routine
a reminder
a temporary focus thread
A loop can contain smaller loops.
 Every loop should help answer:
What is this about?
What is the next thing to do?
What else lives inside it?
What is blocked or deferred?
What notes, events, and references belong here?

4. Design Principles
4.1 Focus over storage
The app should first help me decide and continue, not just store information.
4.2 A loop is a thread, not only a task
A loop can be actionable, reflective, or informational.
4.3 Every loop should surface the next useful move
Each loop should clearly show the next step.
4.4 Nested loops should feel natural
A parent loop and a subloop should feel structurally similar.
4.5 Save for later should be first-class
Deferring something safely is a core action, not a hidden feature.
4.6 One system, multiple life domains
Work and personal should live in one system, with clear separation when needed.
4.7 Capture must be frictionless
Adding something should be easier than writing it in a note.
4.8 Notes support the loop, not replace it
The app should support Obsidian-like notes, but the loop remains the main interaction model.
4.9 Calm UI
The app should feel light, quiet, and readable. No cluttered PM-tool energy.

5. Core Terminology
Loop
A thread of work, thought, responsibility, or intent.
Subloop
A loop inside another loop.
Parent loop
The loop that contains the current loop.
Next step
The most immediate useful action inside a loop.
Active loop
A loop currently relevant and visible in day-to-day work.
Waiting loop
A loop blocked by time, another loop, an event, or another person.
Later
A temporary deferred state for something that should resurface later.
Closed loop
A resolved loop that no longer needs active attention.
Current loop
The loop I am actively inside right now.
Domain
A top-level separation, such as:
Work
Personal
Mode / Type
A loop’s nature, such as:
Action
Thought
Routine
Reference

6. User Problem
Current tools split the experience badly:
tasks are separate from notes
notes are separate from action
reminders are separate from context
personal and work are either mixed too much or split too much
lists become overwhelming
postponed items disappear into a backlog
I lose the thread of what I was actually doing
What I need instead is a system that behaves like a personal assistant + second brain + focus navigator.

7. Primary User Jobs
When I use Loops, I want to be able to:
see what I am currently working on
know what to do next
enter a thread and see its internal structure
add notes and subtasks naturally
break down a loop into subloops
defer something without losing it
see my work and personal worlds separately or together
connect time-bound things to calendar
capture ideas instantly
trust the app to bring things back at the right time

8. Core Object Model
The app should primarily revolve around a single main object:
8.1 Loop object
A loop should support:
title
description / summary
domain
type / mode
status
parent loop
child loops / subloops
next step
tasks / checklist items
notes
deadlines
reminders
save-for-later state
linked events
linked references / documents / URLs
activity / history
timestamps
optional tags
Suggested fields
Identity
id
title
slug or path
created_at
updated_at
Classification
domain: work | personal
type: action | thought | routine | reference
status: active | open | waiting | later | closed
Structure
parent_loop_id
child_loop_ids
depth / nesting level
Action state
next_step
checklist items
progress hint
blocked_reason
dependency_loop_ids
Time
due_date
reminder_at
later_until
linked_event_ids
Content
notes_markdown
references
attachments / docs / links
System behavior
pinned
archived
surfaced_reason
last_active_at

9. Status Model
Keep the system small and understandable.
Recommended states:
Active — currently relevant and in circulation
Waiting — blocked by someone/something/time
Later — intentionally deferred to resurface later
Closed — done / resolved
Open — optional general default if needed
For UI simplicity, the main visible states can be:
Active
Waiting
Later
Closed
“Later” must feel distinct from “Waiting.”
Waiting = cannot proceed yet
Later = choosing not to think about this now

10. Domains
Loops supports two core domains:
Work
Personal
This is one unified system, not two separate apps.
The UI should support viewing:
All
Work only
Personal only
This separation is important because work-time attention and life admin attention should not always compete directly.

11. Loop Types
Loop type should shape emphasis, not create a different object.
Action loop
A project, task thread, or deliverable.
Thought loop
An idea, question, or topic being explored.
Routine loop
Something recurring or habit-like.
Reference loop
A mostly informational thread with supporting notes and links.
All loop types use the same base structure.

12. Product Structure
The product should have these main surfaces:
Home
Loop View
Loops List
Later
Calendar
Quick Capture
Search / Command Bar

13. Home Screen
Purpose
The home screen is the attention dashboard.
It should answer:
What am I in right now?
What should I continue?
What is coming up?
What resurfaced?
What is waiting?
Key rule
Home should not be “all tasks.”
 Home should be “what deserves attention now.”
Recommended sections
13.1 Top bar
search / command
mode switch: All | Work | Personal
quick capture button
13.2 Current Loop
A prominent hero card showing:
current loop title
optional parent breadcrumb
next step
last active time
quick actions:
open
mark next step done
add note
save for later
This should be the main anchor of the app.
13.3 Up Next
A short list of the most relevant active loops.
Sort by a relevance model using:
due dates
reminders
linked events
recent activity
whether it has a defined next step
blocked state
user pinning
13.4 Waiting / Scheduled
Loops that are:
blocked
tied to an upcoming meeting
waiting for another loop
due to resurface soon
13.5 Later resurfacing
Items intentionally deferred that are returning today / soon / overdue.
13.6 Personal summary
When in All mode, show personal items grouped clearly so work context does not get noisy.
Home behavior
Home should feel like a clean stack of meaningful sections, not a giant feed.

14. Loop View
Purpose
The loop view is the heart of the product.
Entering a loop should feel like entering a thread.
Structure
14.1 Header
title
status
domain
type
quick actions:
add note
add subloop
add checklist item
save for later
schedule
close
14.2 Next Up section
This should be visually dominant.
Show:
next step
due state
blocked state if applicable
suggestion if no next step exists
This is the action anchor of the loop.
14.3 Structure section
Show the internal hierarchy:
parent loop breadcrumb
child loops / subloops
subtasks / checklist items
dependencies
Subloops should look like smaller versions of top-level loops.
14.4 Notes section
Markdown-capable notes area with support for:
rich text / markdown
internal links
pasted references
meeting notes
idea fragments
14.5 Calendar / events section
Show linked events and time context:
upcoming calendar events tied to this loop
deadlines
reminders
schedule actions
14.6 References section
Show:
URLs
documents
related resources
linked notes
14.7 Activity timeline
Track things like:
created
updated
reminder set
moved to later
reopened
closed
checklist completed
This will make loops feel alive and traceable.

15. Loops List
Purpose
A broader browsing and management surface.
Filters
Active
Waiting
Later
Closed
Work
Personal
Action
Thought
Routine
Reference
Sorts
Relevance
Recently active
Deadline
Alphabetical
Pinned
Loop card information
Each loop card should show:
title
next step
status
timing signal
domain
optional progress hint
optional subloop count / open item count
Keep cards compact and readable.

16. Save for Later
Purpose
This is a first-class feature.
It solves:
 “I don’t want to deal with this now, but I also don’t want to forget it.”
Definition
A loop or thought can be moved out of the current active surface and scheduled to resurface at a meaningful time or context.
Core interactions
From anywhere, user can choose:
Save for later
Then show a lightweight bottom sheet or popup with options like:
tonight
tomorrow morning
this weekend
next week
pick time
AI suggestion
Optional additions:
add note for why it was deferred
resurface after event
resurface after another loop closes
Two defer modes
Time-based defer
Resurface at a specific date/time.
Context-based defer
Resurface when:
a parent loop closes
an event ends
work mode starts again
a linked meeting happens
another dependency is completed
This context-based resurfacing is a major differentiator.
Later screen
The Later view should show:
due to resurface today
coming soon
overdue resurfacing
manually parked items

17. Quick Capture
Purpose
Capture must be faster than opening a note file.
Supported capture types
new loop
quick task
quick thought
save-for-later item
note
link / reference
voice note on mobile
Interaction style
Capture should begin as a one-line input.
Example:
follow up on design feedback Thursday
buy resistance bands next month
think about quarterly review structure later
plan workout split
Then the app can infer:
title
suggested domain
reminder
potential parent loop
suggested type
The user can enrich later.
Capture principles
minimal friction
no heavy form upfront
one gesture from anywhere
keyboard-first on web
tap-first on Android

18. Search / Command Bar
Purpose
Fast brain navigation.
Should allow:
find any loop
jump to current / recent loops
create loop
defer something
change status
search notes and references
This should feel like a command center, especially on desktop/web.

19. Calendar Integration
Goal
Do not replace calendar. Use calendar as the time layer for loops.
Supported behavior
connect to Google Calendar
link a loop to an event
show upcoming events on Home
resurface loops before relevant events
create reminders from loops
optionally create calendar events from loops
Principle
Calendar should help with timing and resurfacing, not dominate the model.

20. Notes and Editing
Goal
Support Obsidian-like note depth without turning the app into a note-first system.
Notes should support
markdown
internal links
headings
bullets / checklists
references
attachments / URLs
linked thoughts
Principle
Notes support the loop.
 The loop is still the core object.

21. Recursive Model
A defining property of Loops:
A complex loop should feel like a smaller home screen inside itself.
This means a loop can contain subloops, and each loop should still expose:
next step
active subloops
waiting pieces
later pieces
notes
time context
This recursive structure is one of the main product differentiators.

22. Cross-Platform Expectations
Web
Main management surface.
Best for:
browsing
deep editing
managing structure
notes
planning
Android
Fast companion surface.
Best for:
capture
check current loop
check reminders
mark next step done
add notes quickly
save for later
Desktop utility (future)
Compact always-on-top strip / sidebar.
Best for:
current loop
next step
quick capture
defer
recent loops
The utility should not try to be the whole app.

23. Navigation Model
Keep navigation minimal.
Recommended main nav:
Home
Loops
Later
Calendar
Plus:
global capture
search / command
This keeps the app calm and avoids PM-tool overload.

24. Relevance / Ranking Logic
Home and loop lists need a relevance sort.
It should consider:
deadlines
reminders
upcoming events
recently active loops
presence of a defined next step
whether blocked
whether pinned
whether resurfacing from Later
whether part of current focus context
Important: the UI should explain ranking subtly.
Examples:
due tomorrow
reminder at 5 PM
active 2h ago
linked meeting today
resurfaced this morning
This builds trust.

25. UX Principles for Loop Cards
Each loop card should show only what matters most:
title
next step
status
time signal
domain
optional progress hint
Avoid visual noise.
A good loop card tells me:
what this is
what’s next
why it matters now

26. Sample User Flows
26.1 Continue work
Open Home
See Current Loop
Read Next Step
Open loop
Add note / complete subtask / move forward
26.2 Create new work thread
Hit capture
Type title
App creates loop
Assign work domain by default if created in work mode
Optionally set parent loop, reminder, next step
26.3 Break a loop down
Open loop
Add subloops
Add checklist items
Choose next step
Continue inside most relevant subloop
26.4 Save for later
Open loop or capture something new
Tap Save for later
Choose suggested or custom resurfacing time
Item leaves active surface
It reappears on Home / Later at the right time
26.5 Handle a thought
Capture an idea
Mark as Thought loop
Add notes and links
Defer if not actionable now
Reopen later when relevant
26.6 Connect to time
Open loop
Link or create calendar event
Loop shows time context
Resurface before or during relevant event window

27. V1 Scope
V1 should be focused and usable, not overbuilt.
Must-have
loop creation
nested subloops
work / personal domains
statuses
next step
notes with markdown
checklist items
Home view
Loop view
Later / defer feature
basic reminders
basic Google Calendar integration
search
Android + web parity on core actions
Nice-to-have if easy
AI suggested defer times
AI suggested next step
desktop mini utility
widgets on Android
backlinks between loops
Not in V1
collaboration
team/project management features
advanced automation system
overly smart AI agent behavior
too many loop types
heavy custom dashboards
complex permissions / sharing

28. Non-Goals
Loops is not trying to be:
a team PM tool
a pure note-taking app
a full calendar replacement
a habit-only app
a documentation system
a heavy knowledge graph product
It is a personal operating system for threads of intent.

29. What Makes Loops Different
29.1 Thread-based organization
You work in loops, not flat tasks.
29.2 Recursive structure
A loop can contain loops, and this feels natural.
29.3 Next-step focus
Every loop should surface the next useful action.
29.4 Trusted deferral
Later is a real feature, not a hidden snooze.
29.5 Unified life system
Work and personal together, but clearly separable.
29.6 Notes integrated into action
Thoughts, docs, and planning live inside the same thread.

30. Core UX Test
The product is good if the following feels true:
I open it and immediately know what I’m doing
I can continue where I left off
I can quickly add something without breaking flow
I can postpone something and trust it will come back
I can go deep into a project thread without losing structure
my work and personal life both fit without becoming noisy
I feel less scattered after using it

31. Product Statement
Loops is a personal command center that helps me stay inside the right thread of work or life, see the next useful thing to do, and safely defer everything else until it matters again.

32. V1 Screen Summary
Home
Current Loop
Up Next
Waiting / Scheduled
Later resurfacing
mode switch
quick capture
Loop View
title / metadata
next step
subloops
checklist
notes
events
references
activity
Loops List
browse and filter all loops
relevance sort
status/domain/type filters
Later
resurfacing queue
scheduled later items
overdue items
Calendar
linked events
upcoming event-linked loops
Capture
one-line creation
fast defer / reminders / domain suggestion

33. First Build Sequence
A good implementation order:
Phase 1
data model for loops
create/edit loop
nested loops
status model
next step
notes
checklists
Phase 2
Home screen
relevance sorting
loop cards
current loop behavior
Phase 3
Later system
reminders
resurfacing UI
Later screen
Phase 4
search / command bar
domain filters
polish for work/personal switching
Phase 5
Google Calendar integration
Android capture polish
widgets / quick actions

34. Founder Notes
This product should always resist becoming bloated.
Whenever adding something, ask:
does this help me stay in the right loop?
does this reduce cognitive overhead?
does this help me know the next thing?
does this help me safely defer things?
does this make the app more trustworthy and calm?
If not, it probably does not belong.

35. One-Line Internal Build Rule
Design around Current Loop + Next Step + Later.
 Everything else supports those three.

