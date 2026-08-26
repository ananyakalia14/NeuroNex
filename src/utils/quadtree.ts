/* ── Quadtree Spatial Index ──
   Efficient viewport culling for 50K+ map nodes
   Only renders nodes visible in the current viewport
*/

export interface Point {
  id: number;
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rectContains(rect: Rect, p: Point): boolean {
  return p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;
}

function rectIntersects(a: Rect, b: Rect): boolean {
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}

const MAX_POINTS = 8;
const MAX_DEPTH = 10;

export class QuadTree {
  private boundary: Rect;
  private points: Point[] = [];
  private divided = false;
  private depth: number;
  private ne?: QuadTree;
  private nw?: QuadTree;
  private se?: QuadTree;
  private sw?: QuadTree;

  constructor(boundary: Rect, depth = 0) {
    this.boundary = boundary;
    this.depth = depth;
  }

  insert(point: Point): boolean {
    if (!rectContains(this.boundary, point)) return false;

    if (this.points.length < MAX_POINTS || this.depth >= MAX_DEPTH) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) this.subdivide();

    return (
      this.ne!.insert(point) ||
      this.nw!.insert(point) ||
      this.se!.insert(point) ||
      this.sw!.insert(point)
    );
  }

  query(range: Rect, found: Point[] = []): Point[] {
    if (!rectIntersects(this.boundary, range)) return found;

    for (const p of this.points) {
      if (rectContains(range, p)) found.push(p);
    }

    if (this.divided) {
      this.ne!.query(range, found);
      this.nw!.query(range, found);
      this.se!.query(range, found);
      this.sw!.query(range, found);
    }

    return found;
  }

  clear(): void {
    this.points = [];
    this.divided = false;
    this.ne = undefined;
    this.nw = undefined;
    this.se = undefined;
    this.sw = undefined;
  }

  private subdivide(): void {
    const { x, y, w, h } = this.boundary;
    const hw = w / 2;
    const hh = h / 2;
    const d = this.depth + 1;

    this.ne = new QuadTree({ x: x + hw, y, w: hw, h: hh }, d);
    this.nw = new QuadTree({ x, y, w: hw, h: hh }, d);
    this.se = new QuadTree({ x: x + hw, y: y + hh, w: hw, h: hh }, d);
    this.sw = new QuadTree({ x, y: y + hh, w: hw, h: hh }, d);

    this.divided = true;
  }
}
