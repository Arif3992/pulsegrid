let cols = 20;
let rows = 20;
let terrain = [];
let aqi = [42, 87, 156, 65, 38, 120, 95, 55, 140, 70, 48, 110];
let parts = [];
let smoke = [];
function setup() {
  createCanvas(600, 400, WEBGL);
  angleMode(DEGREES);
  for (let r = 0; r < rows; r = r + 1) {
    terrain[r] = [];
    for (let c = 0; c < cols; c = c + 1) {
      terrain[r][c] = noise(c * 0.2, r * 0.2) * 80;
    }
  }
  for (let i = 0; i < 80; i = i + 1) {
    parts.push({
      pos: createVector(random(-150, 150), random(-80, 0), random(-150, 150)),
      vel: createVector(random(-0.4, 0.4), random(-0.8, -0.2), 0),
      life: random(100, 255)
    });
  }
  for (let i = 0; i < 150; i = i + 1) {
    let redCols = [2, 5, 8, 11, 14, 17];
    let rc = redCols[i % redCols.length];
    smoke.push({
      pos: createVector(rc * 15 + random(-8, 8), random(-80, 0), random(0, 285)),
      vel: createVector(random(-0.1, 0.1), random(-0.5, -0.2), random(-0.1, 0.1)),
      life: random(100, 255)
    });
  }
}
function draw() {
  background(220);
  ambientLight(120);
  directionalLight(255, 255, 255, 0, 0, -1);
  orbitControl();
  rotateX(60);
  translate(-90, 0, -90);
  noStroke();
  for (let r = 0; r < rows - 1; r = r + 1) {
    beginShape(TRIANGLE_STRIP);
    for (let c = 0; c < cols; c = c + 1) {
      let v = aqi[c % aqi.length];
      if (v < 50) { fill(46, 160, 67); }
      else if (v < 100) { fill(245, 158, 11); }
      else { fill(220, 38, 38); }
      vertex(c * 15, -terrain[r][c], r * 15);
      vertex(c * 15, -terrain[r + 1][c], (r + 1) * 15);
    }
    endShape();
  }
  for (let i = 0; i < 6; i = i + 1) {
    let col = i * 3;
    let v = aqi[col % aqi.length];
    let h = v;
    push();
    translate(col * 15, -h / 2, 150);
    fill(60, 60, 60);
    box(10, h, 10);
    pop();
  }
  for (let i = 0; i < parts.length; i = i + 1) {
    let p = parts[i];
    p.pos.add(p.vel);
    p.life = p.life - 1;
    if (p.life <= 0) {
      p.pos.set(random(-150, 150), 0, random(-150, 150));
      p.life = 255;
    }
    push();
    translate(p.pos.x, p.pos.y, p.pos.z);
    fill(200, 200, 200, p.life);
    sphere(3);
    pop();
  }
  for (let i = 0; i < smoke.length; i = i + 1) {
    let s = smoke[i];
    s.pos.add(s.vel);
    s.life = s.life - 1;
    if (s.life <= 0) {
      let redCols = [2, 5, 8, 11, 14, 17];
      let rc = redCols[i % redCols.length];
      s.pos.set(rc * 15 + random(-8, 8), 0, random(0, 285));
      s.life = 255;
    }
    push();
    translate(s.pos.x, s.pos.y, s.pos.z);
    fill(150, 150, 150, s.life);
    sphere(3);
    pop();
  }
}
