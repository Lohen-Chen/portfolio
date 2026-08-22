// Boids flocking simulation — gold dots in a black void.
// Based on Craig Reynolds' boids (separation, alignment, cohesion),
// inspired by connor-brooks/microboids and the p5.js flocking example.

const canvas = document.getElementById('boids');
const ctx = canvas.getContext('2d');

const MAX_BOIDS = 300;
const MAX_SPEED = 2.4;
const MAX_FORCE = 0.06;
const NEIGHBOR_RADIUS = 55;
const SEPARATION_RADIUS = 26;
const SEPARATION_WEIGHT = 1.6;
const ALIGNMENT_WEIGHT = 1.0;
const COHESION_WEIGHT = 0.9;

const GOLDS = ['#ffd700', '#f5c542', '#e6b422', '#ffcf40', '#d4af37'];

let width, height;

function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
}

class Boid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * (MAX_SPEED - 1);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.ax = 0;
        this.ay = 0;
        this.r = 1.8;
        this.color = '#DAAA00';
    }

    // Steer toward a desired direction, limited to MAX_FORCE.
    steer(dx, dy) {
        const mag = Math.hypot(dx, dy);
        if (mag === 0) return [0, 0];
        let sx = (dx / mag) * MAX_SPEED - this.vx;
        let sy = (dy / mag) * MAX_SPEED - this.vy;
        const sMag = Math.hypot(sx, sy);
        if (sMag > MAX_FORCE) {
            sx = (sx / sMag) * MAX_FORCE;
            sy = (sy / sMag) * MAX_FORCE;
        }
        return [sx, sy];
    }

    flock(boids) {
        let sepX = 0, sepY = 0, sepCount = 0;
        let aliX = 0, aliY = 0;
        let cohX = 0, cohY = 0, neighborCount = 0;
        const nR2 = NEIGHBOR_RADIUS * NEIGHBOR_RADIUS;
        const sR2 = SEPARATION_RADIUS * SEPARATION_RADIUS;

        for (const other of boids) {
            if (other === this) continue;
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < nR2) {
                aliX += other.vx;
                aliY += other.vy;
                cohX += other.x;
                cohY += other.y;
                neighborCount++;
                if (d2 < sR2 && d2 > 0) {
                    // Push away, weighted by inverse distance.
                    sepX -= dx / d2;
                    sepY -= dy / d2;
                    sepCount++;
                }
            }
        }

        this.ax = 0;
        this.ay = 0;
        if (sepCount > 0) {
            const [fx, fy] = this.steer(sepX, sepY);
            this.ax += fx * SEPARATION_WEIGHT;
            this.ay += fy * SEPARATION_WEIGHT;
        }
        if (neighborCount > 0) {
            let [fx, fy] = this.steer(aliX, aliY);
            this.ax += fx * ALIGNMENT_WEIGHT;
            this.ay += fy * ALIGNMENT_WEIGHT;
            [fx, fy] = this.steer(cohX / neighborCount - this.x, cohY / neighborCount - this.y);
            this.ax += fx * COHESION_WEIGHT;
            this.ay += fy * COHESION_WEIGHT;
        }
    }

    update() {
        this.vx += this.ax;
        this.vy += this.ay;
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > MAX_SPEED) {
            this.vx = (this.vx / speed) * MAX_SPEED;
            this.vy = (this.vy / speed) * MAX_SPEED;
        }
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges.
        if (this.x < -5) this.x = width + 5;
        if (this.x > width + 5) this.x = -5;
        if (this.y < -5) this.y = height + 5;
        if (this.y > height + 5) this.y = -5;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

const boids = [];

// Top up the population to match the viewport area (never removes
// boids, so click-spawned extras survive a resize).
function fillPopulation() {
    const target = Math.min(Math.floor((width * height) / 12000), 120);
    while (boids.length < target) {
        boids.push(new Boid(Math.random() * width, Math.random() * height));
    }
}

function animate() {
    // Translucent black fill leaves faint golden trails.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, width, height);

    for (const boid of boids) boid.flock(boids);
    for (const boid of boids) {
        boid.update();
        boid.draw();
    }
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    resize();
    fillPopulation();
});

// Clicking anywhere (except a link) spawns a new boid at the cursor.
window.addEventListener('pointerdown', (e) => {
    if (e.target instanceof Element && e.target.closest('a')) return;
    boids.push(new Boid(e.clientX, e.clientY));
    if (boids.length > MAX_BOIDS) boids.shift();
});

resize();
fillPopulation();
animate();
