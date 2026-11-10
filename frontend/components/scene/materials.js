import * as THREE from 'three';

let brushed = null;
/** Shared brushed-metal roughness texture (fine horizontal streaks). */
export function brushedTexture() {
  if (brushed) return brushed;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6a6a6a';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * 512;
    const g = 90 + Math.random() * 70;
    ctx.strokeStyle = `rgba(${g},${g},${g},${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, y);
    ctx.lineTo(Math.random() * 512 + 80, y);
    ctx.stroke();
  }
  brushed = new THREE.CanvasTexture(c);
  brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping;
  return brushed;
}

let beanBump = null;
/** Fine pitted / cracked roast surface used as a bump map on coffee beans. */
export function beanBumpTexture() {
  if (beanBump) return beanBump;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);
  // tiny pores
  for (let i = 0; i < 9000; i++) {
    const g = Math.random() < 0.5 ? 40 + Math.random() * 40 : 170 + Math.random() * 60;
    ctx.fillStyle = `rgba(${g},${g},${g},${0.25 + Math.random() * 0.35})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  // hairline roast cracks
  ctx.strokeStyle = 'rgba(30,30,30,0.35)';
  for (let i = 0; i < 70; i++) {
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    ctx.lineWidth = 0.6 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (Math.random() - 0.5) * 30;
      y += (Math.random() - 0.5) * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  beanBump = new THREE.CanvasTexture(c);
  beanBump.wrapS = beanBump.wrapT = THREE.RepeatWrapping;
  return beanBump;
}
