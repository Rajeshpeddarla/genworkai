"use client";

import React, { useEffect, useRef } from "react";
import { MotionValue } from "framer-motion";

export interface KnowledgeCoreProps {
  scrollYProgress: MotionValue<number>;
  isStatic?: boolean; // For login/signup
}

export const KnowledgeCore: React.FC<KnowledgeCoreProps> = ({ scrollYProgress, isStatic = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Neural Brain Canvas System ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Neural Network Properties
    const NUM_NODES = 800; // Drastically increased for massive fullscreen effect
    const brainScale = Math.min(22, (window.innerWidth * 1.8) / 100);

    interface BrainNode { x: number, y: number, z: number, vx: number, vy: number, vz: number, baseRadius: number, glow: number }
    interface Edge { from: BrainNode, to: BrainNode }
    interface Spark { edge: Edge, progress: number, speed: number, color: string }

    let nodes: BrainNode[] = [];
    let edges: Edge[] = [];
    let sparks: Spark[] = [];

    // Generate 3D Brain Hemispheres
    for (let i = 0; i < NUM_NODES; i++) {
      let valid = false;
      let x = 0, y = 0, z = 0;
      while (!valid) {
        // Random point in a box
        const rx = (Math.random() - 0.5) * 2;
        const ry = (Math.random() - 0.5) * 2;
        const rz = (Math.random() - 0.5) * 2;

        // Check if inside a rough sphere
        if (rx * rx + ry * ry + rz * rz < 1) {
          // Scale into an ellipsoid (brain proportions)
          x = rx * 45; // Width (Left to Right)
          y = ry * 35; // Height (Top to Bottom)
          z = rz * 55; // Length (Front to Back)

          // Create longitudinal fissure (gap between left and right hemispheres)
          if (Math.abs(x) > 4) {
            valid = true;
          }
        }
      }

      nodes.push({
        x, y, z,
        vx: (Math.random() - 0.5) * 0.03, // Slower drift
        vy: (Math.random() - 0.5) * 0.03,
        vz: (Math.random() - 0.5) * 0.03,
        baseRadius: Math.random() > 0.85 ? 2.5 : 1,
        glow: Math.random() * Math.PI * 2
      });
    }

    // Connect to 3 nearest neighbors to avoid dense blocks
    const edgeSet = new Set<string>();
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      if (!n1) continue;

      const distances = [];
      for (let j = 0; j < nodes.length; j++) {
        const n2 = nodes[j];
        if (i === j || !n2) continue;
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dz = n1.z - n2.z;
        distances.push({ index: j, dist: dx * dx + dy * dy + dz * dz });
      }
      distances.sort((a, b) => a.dist - b.dist);

      for (let k = 0; k < 3; k++) {
        const d = distances[k];
        if (!d) continue;
        const j = d.index;
        const n2 = nodes[j];
        if (!n2) continue;

        const id1 = Math.min(i, j);
        const id2 = Math.max(i, j);
        const key = `${id1}-${id2}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ from: n1, to: n2 });
        }
      }
    }

    // Spawn sparks randomly along edges
    const spawnSpark = () => {
      if (edges.length === 0) return;
      const edge = edges[Math.floor(Math.random() * edges.length)];
      if (!edge || !edge.from || !edge.to) return;

      sparks.push({
        edge,
        progress: 0,
        speed: 0.002 + Math.random() * 0.004, // Much slower sparks
        color: Math.random() > 0.5 ? '#22d3ee' : '#d946ef' // Cyan or Magenta
      });
    };

    let time = 0;

    const draw = () => {
      const progress = isStatic ? 0 : scrollYProgress.get();
      time += 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);

      // True 3D Rotation around Y-axis based on scroll (slowed down)
      const angle = isStatic ? (time * 0.005) : (progress * Math.PI * 1.5);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Pre-calculate 3D to 2D projection
      const projectedNodes = nodes.map(node => {
        // Subtle drifting
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Push back to origin gently to preserve brain shape
        node.vx += -node.x * 0.0001;
        node.vy += -node.y * 0.0001;
        node.vz += -node.z * 0.0001;

        // 3D Rotation Matrix (around Y axis)
        const rotX = node.x * cosA - node.z * sinA;
        const rotZ = node.z * cosA + node.x * sinA;
        const rotY = node.y;

        // Perspective Projection
        const focalLength = 300;
        const perspective = focalLength / (focalLength + rotZ);

        return {
          screenX: rotX * brainScale * perspective,
          screenY: rotY * brainScale * perspective,
          perspective,
          node
        };
      });

      // Sort by Z (painter's algorithm)
      projectedNodes.sort((a, b) => a.perspective - b.perspective);

      // Draw Edges
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = `rgba(99, 102, 241, 0.4)`; // Consistent opacity, no solid blobs
      ctx.beginPath();
      edges.forEach(edge => {
        const p1 = projectedNodes.find(p => p.node === edge.from);
        const p2 = projectedNodes.find(p => p.node === edge.to);
        if (p1 && p2) {
          ctx.moveTo(p1.screenX, p1.screenY);
          ctx.lineTo(p2.screenX, p2.screenY);
        }
      });
      ctx.stroke();

      // Draw Nodes
      projectedNodes.forEach(p => {
        const { screenX, screenY, perspective, node } = p;
        node.glow += 0.02; // Slower glowing pulse
        // Scale radius by perspective so closer nodes look bigger
        const currentRadius = (node.baseRadius + Math.sin(node.glow) * 0.5) * perspective;
        const isMagenta = Math.sin(node.glow * 0.5) > 0;

        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(0.1, currentRadius), 0, Math.PI * 2);

        const alpha = Math.min(1, perspective * 0.8);
        if (isMagenta) {
          ctx.fillStyle = `rgba(217, 70, 239, ${alpha})`;
          ctx.shadowColor = '#d946ef';
        } else {
          ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.shadowColor = '#22d3ee';
        }

        ctx.shadowBlur = node.baseRadius > 1 ? 15 * perspective : 0;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Draw Sparks
      if (Math.random() < 0.3 && sparks.length < 30) spawnSpark();

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        if (!s) continue;
        s.progress += s.speed;

        if (s.progress >= 1) {
          sparks.splice(i, 1);
          continue;
        }

        const p1 = projectedNodes.find(p => p.node === s.edge.from);
        const p2 = projectedNodes.find(p => p.node === s.edge.to);

        if (p1 && p2) {
          const curX = p1.screenX + (p2.screenX - p1.screenX) * s.progress;
          const curY = p1.screenY + (p2.screenY - p1.screenY) * s.progress;
          const pers = p1.perspective + (p2.perspective - p1.perspective) * s.progress;

          ctx.beginPath();
          ctx.arc(curX, curY, 2 * pers, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 10 * pers;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();

      // Render ambient background stars/dust (outside the brain)
      for (let i = 0; i < 50; i++) {
        const sx = Math.sin(i * 100 + time * 0.01) * canvas.width;
        const sy = Math.cos(i * 200 + time * 0.02) * canvas.height;
        ctx.beginPath();
        ctx.arc((sx + canvas.width) % canvas.width, (sy + canvas.height) % canvas.height, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, 0.4)`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [scrollYProgress, isStatic]);

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden bg-[#020202]">
      {/* Canvas for Neural Brain */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full will-change-transform" />
    </div>
  );
};
