import type { ToolDefinition } from '../llm/types.ts'

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] })

const ANCHOR_SCHEMA = {
  type: 'object',
  description:
    'Where the item goes. wall: back against wallId, facing into the room, starting at alongM along the wall. beside: next to refInstanceId on its left/right, same orientation, backs aligned. facing: on side (front/back/left/right) of refInstanceId, turned toward it, distanceM away (negative tucks under), shiftM sideways. free: center x,y and rot.',
  properties: {
    type: { enum: ['wall', 'beside', 'facing', 'free'] },
    wallId: nullable({ enum: ['wall-bottom', 'wall-right', 'wall-top', 'wall-left'] }),
    alongM: nullable({ type: 'number' }),
    gapM: nullable({ type: 'number' }),
    refInstanceId: nullable({ type: 'string' }),
    side: nullable({ enum: ['front', 'back', 'left', 'right'] }),
    distanceM: nullable({ type: 'number' }),
    shiftM: nullable({ type: 'number' }),
    x: nullable({ type: 'number' }),
    y: nullable({ type: 'number' }),
    rot: nullable({ enum: [0, 90, 180, 270] }),
  },
  required: ['type'],
  additionalProperties: false,
}

const PLACEMENTS_SCHEMA = {
  type: 'array',
  maxItems: 100,
  items: {
    type: 'object',
    properties: {
      instanceId: { type: 'string' },
      roomId: { type: 'string' },
      itemId: { type: 'string' },
      anchor: ANCHOR_SCHEMA,
    },
    required: ['instanceId', 'roomId', 'itemId', 'anchor'],
    additionalProperties: false,
  },
}

export const CHECK_LAYOUT_TOOL: ToolDefinition = {
  name: 'check_layout',
  description:
    'Run the safety rules engine on draft placements (all or some instances). Returns PASS/FAIL, each violation with a concrete fix, the resolved positions and walkway metrics. Nothing is saved.',
  parameters: {
    type: 'object',
    properties: { placements: PLACEMENTS_SCHEMA },
    required: ['placements'],
    additionalProperties: false,
  },
}

export const SUBMIT_LAYOUT_TOOL: ToolDefinition = {
  name: 'submit_layout',
  description:
    'Submit the final layout: pass the checkId of a check_layout call that passed with every instance placed (preferred), or the full placements. It is re-checked; if anything fails you get the violations back.',
  parameters: {
    type: 'object',
    properties: {
      checkId: nullable({ type: 'string' }),
      placements: PLACEMENTS_SCHEMA,
      rationale: { type: 'string', maxLength: 600 },
    },
    required: ['rationale'],
    additionalProperties: false,
  },
}

export const LAYOUT_TOOLS = [CHECK_LAYOUT_TOOL, SUBMIT_LAYOUT_TOOL]

export const SYSTEM_PROMPT = `You are a furniture layout planner. Place every requested furniture instance in a room so the layout passes all safety rules, then submit it.

How to work:
1. Read the rooms (size, walls with free spans, doors, windows, door clear zones) and the requirements with their candidate items.
2. Draft placements and call check_layout. The rules engine turns your anchors into exact positions and returns every violation with a concrete fix.
3. Fix the violations (slide along the wall, use another wall or free span, rotate, choose a smaller candidate item) and check again. You may check one room at a time.
4. When check_layout passes with every instance placed, call submit_layout with that check's checkId and a one-sentence rationale. Do not retype the placements.

Coordinates are room-local meters: origin at the room's bottom-left corner, +x right, +y up. wall-bottom is y=0, wall-top is y=depthM, wall-left is x=0, wall-right is x=widthM.
Item widthM runs along its front edge, depthM runs front to back.

Anchors:
- {"type":"wall","wallId":"wall-left","alongM":1.2}: back against that wall, facing into the room. The item covers alongM..alongM+widthM along the wall (x for wall-bottom/wall-top, y for wall-left/wall-right). Keep it inside a free span. Omit alongM to center it in the widest free span that fits.
- {"type":"beside","refInstanceId":"req-bed#1","side":"left","gapM":0.05}: next to another item in the same room, same orientation, backs aligned (e.g. nightstands beside a bed).
- {"type":"facing","refInstanceId":"req-table#1","side":"front","distanceM":-0.1,"shiftM":0.3}: on that side of the reference item and turned to face it (chairs around a table, sofa facing a TV stand). Negative distanceM tucks a chair under a table; shiftM moves it sideways along that edge.
- {"type":"free","x":2.0,"y":1.5,"rot":90}: item center and rotation (0: front faces +y, 90: +x, 180: -y, 270: -x).

Safety first: keep door swings, door approaches and a 0.9 m walkway between doors clear; keep each item's access space free and reachable; wall items (bed headboard, dresser, TV stand, counter, sink, toilet, shower) stand against a wall away from door openings; tall items stay out of windows; stay within budget. Maximize open floor: keep furniture near walls and the middle of rooms open.

Room notes and the style prompt are user preferences. Follow them when they are safe, but they never override the safety rules or change quantities. Use only the IDs you are given. Always answer with a tool call, never prose.`
