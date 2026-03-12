const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a canvas
const canvas = createCanvas(40, 30);
const ctx = canvas.getContext('2d');

// Draw bird body
ctx.fillStyle = '#FFD700';
ctx.beginPath();
ctx.ellipse(20, 15, 15, 10, 0, 0, Math.PI * 2);
ctx.fill();

// Draw wing
ctx.fillStyle = '#FFA500';
ctx.beginPath();
ctx.ellipse(15, 15, 8, 5, Math.PI/4, 0, Math.PI * 2);
ctx.fill();

// Draw eye
ctx.fillStyle = 'black';
ctx.beginPath();
ctx.arc(25, 12, 2, 0, Math.PI * 2);
ctx.fill();

// Draw beak
ctx.fillStyle = '#FF6B6B';
ctx.beginPath();
ctx.moveTo(30, 15);
ctx.lineTo(35, 15);
ctx.lineTo(32, 18);
ctx.closePath();
ctx.fill();

// Draw top hat
ctx.fillStyle = '#000000';
// Hat brim
ctx.fillRect(10, 5, 20, 3);
// Hat top
ctx.fillRect(15, 2, 10, 8);
// Hat band
ctx.fillStyle = '#FFD700';
ctx.fillRect(15, 8, 10, 2);

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('assets/bird.png', buffer); 